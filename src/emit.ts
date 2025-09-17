import fs from "node:fs";
import { writeJSONFile, readJSONFile } from "./config.js";
import { redactObject } from "./utils/redact.js";

export interface EmitOptions {
  in?: string;
  out?: string;
  sink?: "stdout" | "file" | "github";
}

export async function handleEmit(
  opts: EmitOptions,
): Promise<{ code: number; output: any }> {
  try {
    let obj: any;
    if (opts.in) {
      obj = readJSONFile(opts.in);
    } else {
      const raw = fs.readFileSync(0, "utf8");
      obj = JSON.parse(raw);
    }
    // Execute side-effects (set_labels, script) when present
    await executeSideEffects(obj);

    const safe = redactObject(obj);
    const sink = opts.sink || (opts.out ? "file" : "stdout");
    if (sink === "file") {
      if (!opts.out) throw new Error("Missing --out for file sink");
      writeJSONFile(opts.out, safe);
    } else if (sink === "github") {
      await emitToGithub(safe);
    } else {
      process.stdout.write(JSON.stringify(safe, null, 2) + "\n");
    }
    return { code: 0, output: safe };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[emit] error: ${msg}\n`);
    return { code: 1, output: { error: msg } };
  }
}

async function emitToGithub(obj: any): Promise<void> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("github sink requires GITHUB_TOKEN");
  // Determine repo/owner
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull || !repoFull.includes("/"))
    throw new Error("github sink requires GITHUB_REPOSITORY env (owner/repo)");
  const [owner, repo] = repoFull.split("/");
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  // Support either { events: [...] } or a single event object
  const events = Array.isArray(obj?.events) ? obj.events : [obj];
  for (const ev of events) {
    const event_type: string = ev.event_type || ev.type || "custom";
    const client_payload: any = ev.client_payload || ev.payload || ev;
    await octokit.repos.createDispatchEvent({
      owner,
      repo,
      event_type,
      client_payload,
    } as any);
  }
}

async function executeSideEffects(obj: any): Promise<void> {
  const items = Array.isArray(obj?.events) ? obj.events : [obj];
  for (const ev of items) {
    const cp = ev.client_payload || ev.payload || {};
    if (cp && Array.isArray(cp.set_labels) && cp.set_labels.length) {
      await applyLabels(cp.set_labels);
    }
    if (cp && Array.isArray(cp.script) && cp.script.length) {
      await runScripts(cp.script);
    }
  }
}

async function applyLabels(entries: any[]): Promise<void> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("set_labels requires GITHUB_TOKEN");
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  for (const entry of entries) {
    try {
      const entityUrl = String(entry.entity || "");
      // Expect PR/Issue URLs like https://api.github.com/repos/:owner/:repo/issues/:number or html urls
      const parsed = parseGithubEntity(entityUrl);
      if (!parsed) continue;
      const { owner, repo, number } = parsed;
      const add: string[] = normalizeLabelsArray(entry.add_labels);
      const remove: string[] = normalizeLabelsArray(entry.remove_labels);
      if (add.length) {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: number,
          labels: add,
        });
      }
      for (const label of remove) {
        try {
          await octokit.issues.removeLabel({
            owner,
            repo,
            issue_number: number,
            name: label,
          });
        } catch {}
      }
    } catch {}
  }
}

function normalizeLabelsArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x));
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseGithubEntity(
  url: string,
): { owner: string; repo: string; number: number } | null {
  try {
    if (!url) return null;
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // Accept both /repos/:owner/:repo/issues/:number and /:owner/:repo/pull/:number or /:owner/:repo/issues/:number
    const idxRepos = parts[0] === "repos" ? 1 : 0;
    const owner = parts[idxRepos];
    const repo = parts[idxRepos + 1];
    const type = parts[idxRepos + 2];
    const numberStr = parts[idxRepos + 3];
    if (!owner || !repo) return null;
    let number = Number.parseInt(numberStr, 10);
    if (!Number.isFinite(number)) {
      // Try alternative: .../pull/123
      const altIdx =
        parts.indexOf("pull") >= 0 ? parts.indexOf("pull") + 1 : -1;
      if (altIdx > 0) number = Number.parseInt(parts[altIdx], 10);
    }
    if (!Number.isFinite(number)) return null;
    return { owner, repo, number };
  } catch {
    return null;
  }
}

async function runScripts(lines: string[]): Promise<void> {
  // Execute each line via sh -c in a minimal environment
  const { exec } = await import("node:child_process");
  for (const line of lines) {
    const cmd = String(line || "").trim();
    if (!cmd) continue;
    await new Promise<void>((resolve, reject) => {
      exec(
        cmd,
        { env: process.env, windowsHide: true },
        (err, _stdout, _stderr) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });
  }
}
