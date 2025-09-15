import { describe, it, expect } from "vitest";
import { enrichGithubEvent } from "../src/enrichGithubEvent.js";

function makeMockOctokit({
  pr,
  prFiles,
  prCommits,
  codeowners,
  branchProtection,
}: any) {
  const octo = {
    pulls: {
      async get(_params: any) {
        return { data: pr };
      },
      async listFiles(_params: any) {
        return { data: prFiles, headers: {}, status: 200 };
      },
      async listCommits(_params: any) {
        return { data: prCommits ?? [], headers: {}, status: 200 };
      },
    },
    paginate: async (fn: any, _params: any) => {
      if (fn === (octo as any).pulls.listFiles) return prFiles;
      if (fn === (octo as any).pulls.listCommits) return prCommits ?? [];
      return [];
    },
    repos: {
      async getContent() {
        if (codeowners === undefined)
          throw Object.assign(new Error("no file"), { status: 404 });
        return {
          data: { content: Buffer.from(codeowners).toString("base64") },
        };
      },
      async getBranchProtection() {
        if (branchProtection) return { data: branchProtection };
        throw Object.assign(new Error("forbidden"), { status: 403 });
      },
      async compareCommits() {
        return { data: {} };
      },
    },
  };
  return octo;
}

describe("CODEOWNERS enrichment", () => {
  it("computes per-file owners and owners_union (sorted, deduped)", async () => {
    const pr = {
      number: 7,
      state: "open",
      merged: false,
      draft: false,
      base: { ref: "a5c/main" },
      head: { ref: "feat/owners" },
      changed_files: 3,
      additions: 3,
      deletions: 0,
      labels: [],
      requested_reviewers: [],
      requested_teams: [],
      mergeable_state: "clean",
    };
    const prFiles = [
      {
        filename: "src/x.ts",
        status: "modified",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
      {
        filename: "src/y.ts",
        status: "added",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
      {
        filename: "README.md",
        status: "modified",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ];
    const codeowners = [
      "# comments ignored",
      "src/** @team-a @team-b",
      "README.md @docs",
      "*.md @writers", // last-match-wins rule does not negate previous, but both match README.md
    ].join("\n");
    const mock = makeMockOctokit({
      pr,
      prFiles,
      codeowners,
      branchProtection: { enabled: true },
    });
    const event = {
      repository: { full_name: "a5c-ai/events" },
      pull_request: { number: 7 },
    };
    const out: any = await enrichGithubEvent(event, {
      token: "t",
      octokit: mock,
    });

    expect(out._enrichment.pr.owners["src/x.ts"].sort()).toEqual([
      "@team-a",
      "@team-b",
    ]);
    expect(out._enrichment.pr.owners["src/y.ts"].sort()).toEqual([
      "@team-a",
      "@team-b",
    ]);
    // For README.md, both README.md and *.md patterns match, union of owners
    expect(out._enrichment.pr.owners["README.md"].sort()).toEqual([
      "@docs",
      "@writers",
    ]);
    // owners_union is the deduped union across all changed files, sorted
    expect(out._enrichment.pr.owners_union).toEqual([
      "@docs",
      "@team-a",
      "@team-b",
      "@writers",
    ]);
  });

  it("returns empty owners and owners_union when CODEOWNERS missing", async () => {
    const pr = {
      number: 2,
      state: "open",
      merged: false,
      draft: false,
      base: { ref: "a5c/main" },
      head: { ref: "x" },
      changed_files: 1,
      additions: 1,
      deletions: 0,
      labels: [],
      requested_reviewers: [],
      requested_teams: [],
      mergeable_state: "clean",
    };
    const prFiles = [
      {
        filename: "src/a.ts",
        status: "added",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ];
    const mock = makeMockOctokit({ pr, prFiles, codeowners: undefined });
    const event = {
      repository: { full_name: "a5c-ai/events" },
      pull_request: { number: 2 },
    };
    const out: any = await enrichGithubEvent(event, {
      token: "t",
      octokit: mock,
    });
    expect(out._enrichment.pr.owners["src/a.ts"]).toEqual([]);
    expect(out._enrichment.pr.owners_union).toEqual([]);
  });

  it("ignores commented CODEOWNERS lines and does not crash", async () => {
    const pr = {
      number: 3,
      state: "open",
      merged: false,
      draft: false,
      base: { ref: "a5c/main" },
      head: { ref: "x" },
      changed_files: 1,
      additions: 1,
      deletions: 0,
      labels: [],
      requested_reviewers: [],
      requested_teams: [],
      mergeable_state: "clean",
    };
    const prFiles = [
      {
        filename: "docs/guide.md",
        status: "modified",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ];
    const codeowners = ["# *.md @writers", "# docs/** @docs"].join("\n");
    const mock = makeMockOctokit({ pr, prFiles, codeowners });
    const event = {
      repository: { full_name: "a5c-ai/events" },
      pull_request: { number: 3 },
    };
    const out: any = await enrichGithubEvent(event, {
      token: "t",
      octokit: mock,
    });
    expect(out._enrichment.pr.owners["docs/guide.md"]).toEqual([]);
    expect(out._enrichment.pr.owners_union).toEqual([]);
  });
});
