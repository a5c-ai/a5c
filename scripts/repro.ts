import { handleEnrich } from "../src/enrich.js";

function makePREvent() {
  return {
    repository: { full_name: "a5c-ai/a5c" },
    pull_request: { number: 1, base: { ref: "main" }, head: { ref: "feat" } },
  };
}

function makeMockOctokit() {
  const pr = {
    number: 1,
    state: "open",
    merged: false,
    draft: false,
    base: { ref: "main" },
    head: { ref: "feat" },
    changed_files: 1,
    additions: 1,
    deletions: 0,
  } as any;
  const prFiles = [
    {
      filename: "src/a.js",
      status: "modified",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "+line",
    },
  ] as any[];
  const prCommits = [{ sha: "abc", commit: { message: "test" } }] as any[];
  const compare = {} as any;
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
      if (fn === octo.pulls.listFiles) return prFiles;
      if (fn === octo.pulls.listCommits) return prCommits;
      return [];
    },
    repos: {
      async getContent() {
        return {
          data: { content: Buffer.from("src/** @team").toString("base64") },
        };
      },
      async compareCommits() {
        return { data: compare };
      },
      async getBranchProtection() {
        throw Object.assign(new Error("forbidden"), { status: 403 });
      },
    },
  };
  return octo;
}

async function main() {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a5c-events-"));
  const file = path.join(dir, "event.json");
  fs.writeFileSync(file, JSON.stringify(makePREvent()));
  const resTrue = await handleEnrich({
    in: file,
    labels: [],
    rules: undefined,
    flags: { include_patch: "true" },
    octokit: makeMockOctokit(),
  });
  console.log(
    "include_patch=true patch:",
    resTrue.output.enriched?.github?.pr?.files?.[0]?.patch,
  );
  const resFalse = await handleEnrich({
    in: file,
    labels: [],
    rules: undefined,
    flags: { include_patch: "false" },
    octokit: makeMockOctokit(),
  });
  console.log(
    "include_patch=false patch:",
    resFalse.output.enriched?.github?.pr?.files?.[0]?.patch,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
