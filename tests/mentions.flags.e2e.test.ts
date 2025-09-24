import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleEnrich } from "../src/enrich.js";

// Utility: write object to a temp JSON file
function writeJsonTmp(obj: any): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a5c-events-"));
  const file = path.join(dir, "event.json");
  fs.writeFileSync(file, JSON.stringify(obj), "utf8");
  return file;
}

// Build a minimal PR-like payload to drive enrich logic
function makePullRequestEvent() {
  // samples/pull_request.synchronize.json has the correct envelope; mirror its shape minimally
  return {
    action: "synchronize",
    number: 1,
    pull_request: {
      number: 1,
      state: "open",
      title: "Test PR for mentions flags",
      draft: false,
      base: {
        ref: "a5c/main",
        sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
      head: {
        ref: "feat/branch",
        sha: "cccccccccccccccccccccccccccccccccccccccc",
      },
      labels: [],
      user: { login: "developer-agent", type: "Bot" },
      html_url: "https://github.com/a5c-ai/a5c/pull/1",
    },
    repository: {
      id: 1,
      name: "a5c",
      full_name: "a5c-ai/a5c",
      private: true,
    },
    sender: { login: "developer-agent", type: "Bot", id: 1 },
  };
}

// Mock Octokit that provides PR files and file contents
function makeMockOctokit(opts?: { bigFileBytes?: number }) {
  // Provide one TS file with a code-comment mention, and one large JS file (for size-cap test)
  const prFiles = [
    {
      filename: "src/ok.ts",
      status: "modified",
      additions: 2,
      deletions: 0,
      changes: 2,
      patch: "+ // @developer-agent here",
    },
    {
      filename: "src/big.js",
      status: "modified",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "+ // @someone",
    },
  ];
  const bigBytes = opts?.bigFileBytes ?? 5000;
  const bigContent = "x".repeat(bigBytes) + "\n// @someone";

  const octo: any = {
    pulls: {
      async get() {
        return {
          data: {
            number: 1,
            changed_files: prFiles.length,
            draft: false,
            head: { ref: "feat/branch" },
            base: { ref: "a5c/main" },
          },
        };
      },
      async listFiles() {
        return { data: prFiles, headers: {}, status: 200 };
      },
      async listCommits() {
        return {
          data: [{ sha: "abc", commit: { message: "test" } }],
          headers: {},
          status: 200,
        };
      },
    },
    paginate: async (fn: any) => {
      if (fn === octo.pulls.listFiles) return prFiles;
      if (fn === octo.pulls.listCommits)
        return [{ sha: "abc", commit: { message: "test" } }];
      return [];
    },
    repos: {
      async getContent({ path }: { path: string }) {
        if (path === "src/ok.ts") {
          const content = `// header\n// @developer-agent please check`;
          return {
            data: {
              content: Buffer.from(content, "utf8").toString("base64"),
              encoding: "base64",
              size: Buffer.byteLength(content),
            },
          } as any;
        }
        if (path === "src/big.js") {
          return {
            data: {
              content: Buffer.from(bigContent, "utf8").toString("base64"),
              encoding: "base64",
              size: Buffer.byteLength(bigContent),
            },
          } as any;
        }
        throw Object.assign(new Error("not found"), { status: 404 });
      },
      async compareCommits() {
        return { data: { files: prFiles } };
      },
    },
  };
  return octo;
}

describe("E2E: mentions flags — code comment scanning", () => {
  it("default: scan enabled → code_comment mentions present", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit({ bigFileBytes: 5000 });

    const { output } = await handleEnrich({
      in: inFile,
      flags: { use_github: "true", include_patch: "false" },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    const hasCodeComment = mentions.some((m) => m.source === "code_comment");
    expect(hasCodeComment).toBe(true);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });

  it("patch mode: include_patch=true → patch synthesis yields code_comment mention", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit({ bigFileBytes: 5000 });

    const { output } = await handleEnrich({
      in: inFile,
      flags: { use_github: "true", include_patch: "true" },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    const files = new Set(
      mentions
        .filter((m) => m.source === "code_comment")
        .map((m) => (m.location as any)?.file),
    );
    expect(files.has("src/ok.ts")).toBe(true);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });

  it("disabled: mentions.scan.changed_files=false → no code_comment mentions", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit();

    const { output } = await handleEnrich({
      in: inFile,
      flags: {
        use_github: "true",
        include_patch: "false",
        "mentions.scan.changed_files": "false",
      },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    const codeMentions = mentions.filter((m) => m.source === "code_comment");
    expect(codeMentions.length).toBe(0);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });

  it("size cap: mentions.max_file_bytes=1024 → large files skipped", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit({ bigFileBytes: 10_000 });

    const { output } = await handleEnrich({
      in: inFile,
      flags: {
        use_github: "true",
        include_patch: "false",
        "mentions.max_file_bytes": 1024,
      },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    const bigMentions = mentions.filter(
      (m) => (m.location as any)?.file === "src/big.js",
    );
    expect(bigMentions.length).toBe(0);
    // Ensure the small file still contributes when not filtered by language
    const okMentions = mentions.filter(
      (m) => (m.location as any)?.file === "src/ok.ts",
    );
    expect(okMentions.length).toBeGreaterThan(0);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });

  it("language allowlist: mentions.languages=ts → only TS files scanned", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit({ bigFileBytes: 5000 });

    const { output } = await handleEnrich({
      in: inFile,
      flags: {
        use_github: "true",
        include_patch: "false",
        "mentions.languages": "ts",
      },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    // Only TS file mentions should appear
    const hasOnlyTs = mentions.every((m) =>
      (m.location as any)?.file?.endsWith(".ts"),
    );
    expect(hasOnlyTs).toBe(true);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });

  it("language allowlist: extensions normalize → .tsx and .ts map to ts", async () => {
    const prev = {
      A: process.env.A5C_AGENT_GITHUB_TOKEN,
      G: process.env.GITHUB_TOKEN,
    };
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const event = makePullRequestEvent();
    const inFile = writeJsonTmp(event);
    const octo = makeMockOctokit({ bigFileBytes: 5000 });

    // Case A: dot-prefixed extension
    {
      const { output } = await handleEnrich({
        in: inFile,
        flags: {
          use_github: "true",
          include_patch: "false",
          "mentions.languages": ".tsx",
        },
        labels: [],
        rules: undefined,
        octokit: octo,
      });
      const mentions: any[] = (output as any).enriched?.mentions || [];
      // Only TS file should appear
      const files = new Set(
        mentions
          .filter((m) => m.source === "code_comment")
          .map((m) => (m.location as any)?.file),
      );
      expect(files.has("src/ok.ts")).toBe(true);
      expect(files.has("src/big.js")).toBe(false);
    }

    // Case B: bare extension without dot
    {
      const { output } = await handleEnrich({
        in: inFile,
        flags: {
          use_github: "true",
          include_patch: "false",
          "mentions.languages": "tsx",
        },
        labels: [],
        rules: undefined,
        octokit: octo,
      });
      const mentions: any[] = (output as any).enriched?.mentions || [];
      const files = new Set(
        mentions
          .filter((m) => m.source === "code_comment")
          .map((m) => (m.location as any)?.file),
      );
      expect(files.has("src/ok.ts")).toBe(true);
      expect(files.has("src/big.js")).toBe(false);
    }
    // Using a mix of extension forms; normalization should accept and map them to IDs
    const { output } = await handleEnrich({
      in: inFile,
      flags: {
        use_github: "true",
        include_patch: "false",
        "mentions.languages": ".tsx,.ts,.yml",
      },
      labels: [],
      rules: undefined,
      octokit: octo,
    });
    const mentions: any[] = (output as any).enriched?.mentions || [];
    // Only TypeScript (ts) and YAML should be allowed; our mock only exposes .ts and .js
    const nonAllowed = mentions.filter((m) =>
      (m.location as any)?.file?.endsWith(".js"),
    );
    expect(nonAllowed.length).toBe(0);
    const allowedTs = mentions.filter((m) =>
      (m.location as any)?.file?.endsWith(".ts"),
    );
    expect(allowedTs.length).toBeGreaterThan(0);
    if (prev.A === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev.A!;
    if (prev.G === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prev.G!;
  });
});
