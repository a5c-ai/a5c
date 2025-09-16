import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

describe("handleEnrich integrates enrichGithubEvent", () => {
  it("maps PR enrichment under enriched.github and respects include_patch=false", async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN;
    process.env.A5C_AGENT_GITHUB_TOKEN = "test-token";
    const baseEvent = {
      repository: { full_name: "a5c-ai/events" },
      pull_request: { number: 1 },
    };
    // mock octokit path via opts.octokit by passing through to enrichGithubEvent
    const mock = {
      pulls: {
        async get() {
          return {
            data: {
              number: 1,
              state: "open",
              merged: false,
              draft: false,
              base: { ref: "main" },
              head: { ref: "feat" },
              changed_files: 1,
              additions: 1,
              deletions: 0,
            },
          };
        },
        async listFiles() {
          return {
            data: [
              {
                filename: "src/a.js",
                additions: 1,
                deletions: 0,
                changes: 1,
                patch: "---",
              },
            ],
            headers: {},
            status: 200,
          };
        },
        async listCommits() {
          return {
            data: [{ sha: "abc", commit: { message: "x" } }],
            headers: {},
            status: 200,
          };
        },
      },
      paginate: async (fn: any) =>
        fn === (mock as any).pulls.listFiles
          ? [
              {
                filename: "src/a.js",
                additions: 1,
                deletions: 0,
                changes: 1,
                patch: "---",
              },
            ]
          : [{ sha: "abc", commit: { message: "x" } }],
      repos: {
        async getContent() {
          throw Object.assign(new Error("no file"), { status: 404 });
        },
        async getBranchProtection() {
          throw Object.assign(new Error("forbidden"), { status: 403 });
        },
      },
    };
    const tmp = require("node:os").tmpdir() + "/event-pr.json";
    require("node:fs").writeFileSync(tmp, JSON.stringify(baseEvent));
    const { output } = await handleEnrich({
      in: tmp,
      flags: { use_github: true, include_patch: false },
      octokit: mock,
    });
    expect(output.enriched?.github?.pr?.number).toBe(1);
    expect(output.enriched?.github?.pr?.files?.[0]?.patch).toBeUndefined();
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN;
    else process.env.A5C_AGENT_GITHUB_TOKEN = prev;
  });
});
