import fs from "node:fs";
import path from "node:path";

export interface SimulateOptions {
  kind: "issue_comment" | "pull_request";
  event?: string; // created, opened, labeled, etc.
  out?: string; // write to file if provided; else stdout
}

export async function handleSimulate(
  opts: SimulateOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    const payload = buildPayload(opts.kind, (opts.event || "").toLowerCase());
    const json = JSON.stringify(payload, null, 2) + "\n";
    if (opts.out) {
      const outPath = path.resolve(opts.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, json, "utf8");
    } else {
      process.stdout.write(json);
    }
    return { code: 0 };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

function buildPayload(kind: string, event: string): any {
  if (kind === "issue_comment") {
    return issueCommentCreated();
  }
  if (kind === "pull_request") {
    if (event === "labeled") return pullRequestLabeled();
    return pullRequestOpened();
  }
  throw new Error(`Unknown kind: ${kind}`);
}

function issueCommentCreated(): any {
  return {
    action: "created",
    comment: {
      id: 1,
      body: "This is a test comment",
      user: { login: "octocat" },
      created_at: new Date().toISOString(),
    },
    issue: {
      number: 42,
      title: "Issue title",
      user: { login: "octocat" },
      labels: [{ name: "bug" }],
    },
    repository: { full_name: "owner/repo" },
    sender: { login: "octocat" },
  };
}

function pullRequestOpened(): any {
  return {
    action: "opened",
    number: 123,
    pull_request: {
      number: 123,
      title: "Add new feature",
      body: "This PR adds a new feature.",
      user: { login: "octocat" },
      head: { ref: "feature-branch", sha: "deadbeef" },
      base: { ref: "main", sha: "cafebabe" },
      labels: [],
      created_at: new Date().toISOString(),
    },
    repository: { full_name: "owner/repo" },
    sender: { login: "octocat" },
  };
}

function pullRequestLabeled(): any {
  return {
    action: "labeled",
    number: 123,
    label: { name: "ready-for-review" },
    pull_request: {
      number: 123,
      title: "Add new feature",
      body: "This PR adds a new feature.",
      user: { login: "octocat" },
      head: { ref: "feature-branch", sha: "deadbeef" },
      base: { ref: "main", sha: "cafebabe" },
      labels: [{ name: "ready-for-review" }],
      created_at: new Date().toISOString(),
    },
    repository: { full_name: "owner/repo" },
    sender: { login: "octocat" },
  };
}


