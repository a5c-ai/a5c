import { describe, it, expect } from "vitest";
import { resolve } from "node:path";

// No direct CLI spawning in these E2E tests; we exercise the library entry

// We rely on the existing sample payload on disk; no need to construct one here

// Mock Octokit that returns one small TS file with a code-comment mention and one large JS file
function makeMockOctokit() {
  const pr = {
    number: 1,
    state: "open",
    merged: false,
    draft: false,
    base: { ref: "a5c/main" },
    head: { ref: "feat/x" },
    changed_files: 2,
    additions: 2,
    deletions: 0,
    labels: [],
  };
  const prFiles = [
    {
      filename: "src/a.ts",
      status: "modified",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "+ // hello @developer-agent",
    },
    {
      filename: "src/b.js",
      status: "modified",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "+ /* @someone */",
    },
  ];
  const prCommits = [{ sha: "abc", commit: { message: "test" } }];

  const huge = "x".repeat(1500) + "\n// @someone"; // > 1024 bytes

  const octo: any = {
    pulls: {
      async get() {
        return { data: pr };
      },
      async listFiles() {
        return { data: prFiles, headers: {}, status: 200 };
      },
      async listCommits() {
        return { data: prCommits, headers: {}, status: 200 };
      },
    },
    paginate: async (fn: any) => {
      if (fn === (octo as any).pulls.listFiles) return prFiles;
      if (fn === (octo as any).pulls.listCommits) return prCommits;
      return [];
    },
    repos: {
      async getContent({ path }: { path: string }) {
        if (path === "src/a.ts") {
          const content = `// header\n// @developer-agent here\nexport const a = 1\n`;
          return {
            data: {
              content: Buffer.from(content).toString("base64"),
              encoding: "base64",
              size: Buffer.byteLength(content),
            },
          };
        }
        if (path === "src/b.js") {
          const content = huge;
          return {
            data: {
              content: Buffer.from(content).toString("base64"),
              encoding: "base64",
              size: Buffer.byteLength(content),
            },
          };
        }
        throw Object.assign(new Error("not found"), { status: 404 });
      },
      async compareCommits() {
        return { data: {} };
      },
      async getBranchProtection() {
        throw Object.assign(new Error("forbidden"), { status: 403 });
      },
    },
  };
  return octo;
}

// Library-driven tests calling handleEnrich to simulate full enrich flow
import { handleEnrich } from "../src/enrich.js";

describe("E2E (library): mentions flags for code comment scanning", () => {
  it("default: scan enabled → finds code_comment mention via patch synthesis", async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN;
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    // event intentionally unused: handleEnrich reads from sample file path
    const octokit = makeMockOctokit();
    const { output } = await handleEnrich({
      in: resolve("samples/pull_request.synchronize.json"),
      labels: [],
      flags: { use_github: "true", include_patch: "true" },
      octokit,
    });
    const mentions = (output as any)?.enriched?.mentions || [];
    const hasCode = mentions.some((m: any) => m.source === "code_comment");
    expect(hasCode).toBe(true);
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev;
  });

  it("disabled: --flag mentions.scan.changed_files=false → no code_comment mentions", async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN;
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    // event intentionally unused: handleEnrich reads from sample file path
    const octokit = makeMockOctokit();
    const { output } = await handleEnrich({
      in: resolve("samples/pull_request.synchronize.json"),
      labels: [],
      flags: {
        use_github: "true",
        include_patch: "true",
        "mentions.scan.changed_files": "false",
      },
      octokit,
    });
    const mentions = (output as any)?.enriched?.mentions || [];
    const hasCode = mentions.some((m: any) => m.source === "code_comment");
    expect(hasCode).toBe(false);
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev;
  });

  it("size cap: --flag mentions.max_file_bytes=1024 with include_patch=false → large raw files skipped, TS still captured", async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN;
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const octokit = makeMockOctokit();
    // Disable patch scanning so fallback uses raw file contents with size filter
    const { output } = await handleEnrich({
      in: resolve("samples/pull_request.synchronize.json"),
      labels: [],
      flags: {
        use_github: "true",
        include_patch: "false",
        "mentions.max_file_bytes": "1024",
      },
      octokit,
    });
    const mentions = (output as any)?.enriched?.mentions || [];
    // Ensure we did not pick up from big JS (size > 1024), but still found from TS patch/content
    const files = new Set(
      mentions
        .filter((m: any) => m.source === "code_comment")
        .map((m: any) => (m.location as any)?.file),
    );
    expect(files.has("src/b.js")).toBe(false);
    expect(files.has("src/a.ts")).toBe(true);
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev;
  });

  it("language allowlist: --flag mentions.languages=ts → only ts scanned", async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN;
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const octokit = makeMockOctokit();
    const { output } = await handleEnrich({
      in: resolve("samples/pull_request.synchronize.json"),
      labels: [],
      flags: {
        use_github: "true",
        include_patch: "true",
        "mentions.languages": "ts",
      },
      octokit,
    });
    const mentions = (output as any)?.enriched?.mentions || [];
    const files = new Set(
      mentions
        .filter((m: any) => m.source === "code_comment")
        .map((m: any) => (m.location as any)?.file),
    );
    expect(files.has("src/a.ts")).toBe(true);
    expect(files.has("src/b.js")).toBe(false);
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev;
  });
});
