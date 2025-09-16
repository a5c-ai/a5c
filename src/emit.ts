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
