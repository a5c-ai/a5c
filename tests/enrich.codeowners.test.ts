import { describe, it, expect } from "vitest";
import { enrichGithubEvent } from "../src/enrichGithubEvent.js";

function makeMockOctokit({
  pr,
  prFiles,
  prCommits,
  compare,
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
      async compareCommits() {
        return { data: compare ?? {} };
      },
      async getBranchProtection() {
        if (branchProtection) return { data: branchProtection };
        throw Object.assign(new Error("forbidden"), { status: 403 });
      },
    },
  };
  return octo;
}

function basePREvent() {
  return {
    repository: { full_name: "a5c-ai/a5c" },
    pull_request: { number: 1 },
  };
}

function defaultPRShape() {
  return {
    number: 1,
    state: "open",
    merged: false,
    draft: false,
    base: { ref: "main" },
    head: { ref: "feat" },
    changed_files: 2,
    additions: 10,
    deletions: 2,
    mergeable_state: "clean",
    labels: [],
    requested_reviewers: [],
    requested_teams: [],
  };
}

describe("CODEOWNERS enrichment (owners and owners_union)", () => {
  it("No CODEOWNERS -> empty owners per file and empty union", async () => {
    const pr = defaultPRShape();
    const prFiles = [
      {
        filename: "src/a.js",
        status: "modified",
        additions: 5,
        deletions: 1,
        changes: 6,
      },
      {
        filename: "README.md",
        status: "modified",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ];
    const prCommits = [{ sha: "abc", commit: { message: "x" } }];
    const mock = makeMockOctokit({
      pr,
      prFiles,
      prCommits,
      compare: {},
      codeowners: undefined,
      branchProtection: undefined,
    });

    const out: any = await enrichGithubEvent(basePREvent(), {
      token: "t",
      octokit: mock,
    });
    expect(out._enrichment.pr.owners["src/a.js"]).toEqual([]);
    expect(out._enrichment.pr.owners["README.md"]).toEqual([]);
    expect(out._enrichment.pr.owners_union).toEqual([]);
  });

  it("With CODEOWNERS rules -> per-file owners and sorted union", async () => {
    const pr = defaultPRShape();
    const prFiles = [
      {
        filename: "src/a.js",
        status: "modified",
        additions: 5,
        deletions: 1,
        changes: 6,
      },
      {
        filename: "README.md",
        status: "added",
        additions: 5,
        deletions: 1,
        changes: 6,
      },
    ];
    const prCommits = [{ sha: "abc", commit: { message: "x" } }];
    const codeowners = "src/** @team-a @alice\nREADME.md @docs\n";
    const mock = makeMockOctokit({
      pr,
      prFiles,
      prCommits,
      compare: {},
      codeowners,
      branchProtection: { enabled: true },
    });

    const out: any = await enrichGithubEvent(basePREvent(), {
      token: "t",
      octokit: mock,
    });
    expect(
      (out._enrichment.pr.owners["src/a.js"] || []).slice().sort(),
    ).toEqual(["@alice", "@team-a"]);
    expect(
      (out._enrichment.pr.owners["README.md"] || []).slice().sort(),
    ).toEqual(["@docs"]);
    expect(out._enrichment.pr.owners_union).toEqual([
      "@alice",
      "@docs",
      "@team-a",
    ]);
  });

  it("Comments-only CODEOWNERS -> empty owners and empty union", async () => {
    const pr = defaultPRShape();
    const prFiles = [
      {
        filename: "src/a.js",
        status: "modified",
        additions: 5,
        deletions: 1,
        changes: 6,
      },
      {
        filename: "README.md",
        status: "modified",
        additions: 1,
        deletions: 0,
        changes: 1,
      },
    ];
    const prCommits = [{ sha: "abc", commit: { message: "x" } }];
    const codeowners =
      "# top-level comments only\n\n   # another comment line\n";
    const mock = makeMockOctokit({
      pr,
      prFiles,
      prCommits,
      compare: {},
      codeowners,
      branchProtection: undefined,
    });

    const out: any = await enrichGithubEvent(basePREvent(), {
      token: "t",
      octokit: mock,
    });
    expect(out._enrichment.pr.owners["src/a.js"]).toEqual([]);
    expect(out._enrichment.pr.owners["README.md"]).toEqual([]);
    expect(out._enrichment.pr.owners_union).toEqual([]);
  });

  it("Overlapping patterns de-duplicate owners in union", async () => {
    const pr = defaultPRShape();
    const prFiles = [
      {
        filename: "src/a.js",
        status: "modified",
        additions: 5,
        deletions: 1,
        changes: 6,
      },
    ];
    const prCommits = [{ sha: "abc", commit: { message: "x" } }];
    const codeowners = "src/** @team-a\nsrc/a.js @alice\n";
    const mock = makeMockOctokit({
      pr,
      prFiles,
      prCommits,
      compare: {},
      codeowners,
      branchProtection: undefined,
    });

    const out: any = await enrichGithubEvent(basePREvent(), {
      token: "t",
      octokit: mock,
    });
    expect(
      (out._enrichment.pr.owners["src/a.js"] || []).slice().sort(),
    ).toEqual(["@alice", "@team-a"]);
    expect(out._enrichment.pr.owners_union).toEqual(["@alice", "@team-a"]);
  });
});
