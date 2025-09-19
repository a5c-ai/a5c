import fs from "node:fs";
import { writeJSONFile, readJSONFile } from "./config.js";
import os from "node:os";
import path from "node:path";
import { parseGithubEntity as parseGithubEntityUtil } from "./utils/githubEntity.js";
import { redactObject } from "./utils/redact.js";
import { createLogger } from "./log.js";

export interface EmitOptions {
  in?: string;
  out?: string;
  sink?: "stdout" | "file" | "github";
}

const logger = createLogger({ scope: "emit" });
const dbg = (msg: string, ctx?: Record<string, unknown>) =>
  logger.debug(msg, ctx);

export async function handleEmit(
  opts: EmitOptions,
): Promise<{ code: number; output: any }> {
  try {
    let obj: any;
    if (opts.in && opts.in !== "-") {
      obj = readJSONFile(opts.in);
    } else {
      const raw = fs.readFileSync(0, "utf8");
      obj = JSON.parse(raw);
    }
    // Execute side-effects (set_labels, script) when present
    await executeSideEffects(obj);

    const safe = redactObject(obj);
    const sink = opts.sink || (opts.out ? "file" : "github");
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

function writeTempEventJson(obj: any): string {
  // Prefer a deterministic /tmp/a5c-event.json path for portability across steps
  // Fall back to OS temp dir or CWD if /tmp is unavailable
  const preferred = "/tmp/a5c-event.json";
  try {
    // Ensure parent dir exists (no-op if already present)
    fs.mkdirSync(path.dirname(preferred), { recursive: true });
    fs.writeFileSync(preferred, JSON.stringify(obj, null, 2), "utf8");
    return preferred;
  } catch {}
  try {
    const dir = process.env.RUNNER_TEMP || process.env.TEMP || os.tmpdir();
    const file = path.join(dir, "a5c-event.json");
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
    return file;
  } catch {}
  // Fallback to current working directory
  try {
    const file = path.resolve("a5c-event.json");
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
    return file;
  } catch {
    return "";
  }
}

async function emitToGithub(obj: any): Promise<void> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("github sink requires GITHUB_TOKEN");
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  // Support either { events: [...] } or a single event object
  const events = Array.isArray(obj?.events) ? obj.events : [obj];
  for (const ev of events) {
    const event_type: string = ev.event_type || ev.type || "custom";
    // Skip command_only events; they are for side-effects only
    if (event_type === "command_only") {
      dbg("github sink: skip command_only event");
      continue;
    }
    const client_payload: any = ev.client_payload || ev.payload || ev;
    const repoTarget = resolveOwnerRepo(client_payload);
    if (!repoTarget) {
      process.stderr.write(
        `[emit] github sink: unable to resolve owner/repo for event_type=${event_type}; skipping dispatch\n`,
      );
      continue;
    }
    const { owner, repo } = repoTarget;
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
    try {
      (globalThis as any).__A5C_EMIT_CTX__ = { event: cp };
    } catch {}
    // Prepare temp file with the current event payload for scripts
    const tmpEventPath = writeTempEventJson(ev);
    const scriptEnv = {
      ...process.env,
      ...(cp.env || {}),
      // Fill well-known fallbacks for downstream scripts
      EVENT_PATH: tmpEventPath,
      A5C_EVENT_PATH: tmpEventPath,
      // Inherit template URI from process env if not provided in payload env
      A5C_TEMPLATE_URI:
        (cp.env && cp.env.A5C_TEMPLATE_URI) ||
        process.env.A5C_TEMPLATE_URI ||
        "",
      // Ensure package spec is available for re-entrant CLI execution
      A5C_PKG_SPEC: resolvePkgSpec(cp),
    } as Record<string, string>;
    cp.env = scriptEnv;
    const checksContext = await startStatusChecks(cp);
    // Prepare script env for status checks. comma seperated: [commit_sha]-[context]
    const status_checks = checksContext.targets
      .map((t) => `${t.sha}-${t.context}`)
      .join(",");
    scriptEnv.A5C_STATUS_CHECKS = status_checks;
    // Fill missing entity from context
    const defaultEntity = inferEntityUrl(cp);
    if (cp && Array.isArray(cp.pre_set_labels) && cp.pre_set_labels.length) {
      const filled = cp.pre_set_labels.map((e: any) => ({
        ...e,
        entity: e?.entity || defaultEntity,
      }));
      dbg(`execute pre_set_labels count=${filled.length}`);
      await applyLabels(filled);
    }
    if (cp && Array.isArray(cp.script) && cp.script.length) {
      dbg(`execute script lines=${cp.script.length}`);
      try {
        await runScripts(cp.script, {
          event: cp,
          env: scriptEnv,
          event_path: tmpEventPath,
        });
        await finishStatusChecks(checksContext, true, cp);
      } catch (e) {
        await finishStatusChecks(checksContext, false, cp);
        throw e;
      }
    }
    if (cp && Array.isArray(cp.set_labels) && cp.set_labels.length) {
      const filled = cp.set_labels.map((e: any) => ({
        ...e,
        entity: e?.entity || defaultEntity,
      }));
      dbg(`execute set_labels count=${filled.length}`);
      await applyLabels(filled);
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
      const parsed = parseGithubEntity(entityUrl);
      if (!parsed) {
        dbg(`skip labels entry: cannot parse entity '${entityUrl}'`);
        continue;
      }
      const { owner, repo, number } = parsed;
      const add: string[] = normalizeLabelsArray(entry.add_labels);
      const remove: string[] = normalizeLabelsArray(entry.remove_labels);
      dbg(
        `labels target ${owner}/${repo}#${number} add=[${add.join(",")}] remove=[${remove.join(",")}]`,
      );
      let current: Set<string> = new Set();
      try {
        const resp = await octokit.issues.listLabelsOnIssue({
          owner,
          repo,
          issue_number: number,
          per_page: 100,
        });
        const names = Array.isArray(resp.data)
          ? resp.data.map((l: any) => String(l.name))
          : [];
        current = new Set(names);
        dbg(`current labels: [${names.join(",")}]`);
      } catch (e: any) {
        dbg(`listLabelsOnIssue failed: ${e?.status || "?"} ${e?.message || e}`);
      }
      if (add.length) {
        await ensureLabelsExist(octokit as any, owner, repo, add);
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: number,
          labels: add,
        });
      }
      for (const label of remove) {
        if (!current.has(label)) {
          dbg(`skip remove '${label}' (not present)`);
          continue;
        }
        try {
          await octokit.issues.removeLabel({
            owner,
            repo,
            issue_number: number,
            name: label,
          });
        } catch (e: any) {
          dbg(
            `removeLabel '${label}' failed: ${e?.status || "?"} ${e?.message || e}`,
          );
        }
      }
    } catch {}
  }
}

type StatusChecksSpec = Array<{
  name: string;
  description?: string;
  pull_request_url?: string;
}>;

async function startStatusChecks(cp: any): Promise<{
  targets: Array<{ owner: string; repo: string; sha: string; context: string }>;
}> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return { targets: [] };
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  const spec: StatusChecksSpec = Array.isArray(cp?.status_checks)
    ? cp.status_checks
    : [];
  if (!spec.length) return { targets: [] };
  const repoInfo = resolveOwnerRepo(cp);
  if (!repoInfo) return { targets: [] };
  const { owner, repo } = repoInfo;
  const sha = await resolveShaFromContext(octokit, cp, owner, repo);
  if (!sha) return { targets: [] };
  const targets: Array<{
    owner: string;
    repo: string;
    sha: string;
    context: string;
  }> = [];
  for (const item of spec) {
    const context = expandAnyTemplates(item.name, { event: cp, env: cp.env });
    const description = expandAnyTemplates(item.description || "Queued", {
      event: cp,
      env: cp.env,
    });
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state: "queued",
      context,
      description,
    } as any);
    targets.push({ owner, repo, sha, context });
  }
  return { targets };
}

async function finishStatusChecks(
  ctx: {
    targets: Array<{
      owner: string;
      repo: string;
      sha: string;
      context: string;
    }>;
  },
  success: boolean,
  cp: any,
): Promise<void> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return;
  if (!ctx || !ctx.targets || !ctx.targets.length) return;
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  const description = success ? "Completed" : "Failed";
  for (const t of ctx.targets) {
    await octokit.repos.createCommitStatus({
      owner: t.owner,
      repo: t.repo,
      sha: t.sha,
      state: success ? "success" : "failure",
      context: t.context,
      description,
    } as any);
  }
}

async function resolveShaFromContext(
  octokit: any,
  cp: any,
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    // Prefer pull_request.head.sha
    const pr =
      cp?.pull_request ||
      cp?.payload?.pull_request ||
      cp?.original_event?.pull_request;
    if (pr?.head?.sha) return String(pr.head.sha);
    // Try event SHA
    if (cp?.sha) return String(cp.sha);
    if (cp?.payload?.sha) return String(cp.payload.sha);
    // Fallback: latest commit on default branch
    const repoResp = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoResp?.data?.default_branch || "main";
    const refResp = await octokit.repos.getBranch({
      owner,
      repo,
      branch: defaultBranch,
    });
    return String(refResp?.data?.commit?.sha || "");
  } catch {
    return null;
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

// Re-export the shared helper to preserve the public API
export const parseGithubEntity = parseGithubEntityUtil;

async function runScripts(lines: string[], ctx?: any): Promise<void> {
  // Execute each line via sh -c in a minimal environment
  const { exec } = await import("node:child_process");
  for (const line of lines) {
    let cmd = String(line || "").trim();
    if (!cmd) continue;
    // Expand ${{ }} using client payload context when possible
    try {
      const gctx = (globalThis as any).__A5C_EMIT_CTX__ || {};
      const fullCtx = ctx || gctx;
      cmd = expandInlineTemplates(cmd, fullCtx);
    } catch {}
    const finalEnv = { ...process.env, ...((ctx as any)?.env || {}) };
    // debug log
    await new Promise<void>((resolve, reject) => {
      exec(
        cmd,
        {
          env: finalEnv,
          windowsHide: true,
        },
        (err, stdout, stderr) => {
          if (stdout)
            try {
              process.stdout.write(String(stdout));
            } catch {}
          if (stderr)
            try {
              process.stderr.write(String(stderr));
            } catch {}
          if (err) return reject(err);
          resolve();
        },
      );
    });
  }
}

function expandInlineTemplates(s: string, ctx: any): string {
  return String(s).replace(/\$\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
    try {
      const fn = new Function(
        "event",
        "env",
        "event_path",
        `return (${expr});`,
      );
      const event = ctx?.event || ctx;
      const mergedEnv = { ...process.env, ...(ctx?.env || {}) };
      const v = fn(event, mergedEnv, ctx?.event_path);
      return v == null ? "" : String(v);
    } catch {
      return "";
    }
  });
}

function expandAnyTemplates(s: string, ctx: any): string {
  if (s == null) return s as any;
  let out = String(s);
  // Support both ${{ }} and {{ }} syntaxes
  out = expandInlineTemplates(out, ctx);
  out = out.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
    try {
      const fn = new Function(
        "event",
        "env",
        "event_path",
        `return (${expr});`,
      );
      const event = ctx?.event || ctx;
      const mergedEnv = { ...process.env, ...(ctx?.env || {}) };
      const v = fn(event, mergedEnv, ctx?.event_path);
      return v == null ? "" : String(v);
    } catch {
      return "";
    }
  });
  return out;
}

async function ensureLabelsExist(
  octokit: any,
  owner: string,
  repo: string,
  labels: string[],
): Promise<void> {
  const unique = Array.from(new Set(labels.map((n) => String(n))));
  for (const name of unique) {
    try {
      await octokit.issues.createLabel({
        owner,
        repo,
        name,
        color: generateLabelColor(name),
      });
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      if (!/422|already exists|exists/i.test(msg) && !/409/.test(msg)) {
        // ignore other errors (permissions, etc.)
      }
    }
  }
}

function generateLabelColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  let r = (h & 0xff) ^ 0x55;
  let g = ((h >> 8) & 0xff) ^ 0x55;
  let b = ((h >> 16) & 0xff) ^ 0x55;
  const min = 40;
  const max = 215;
  r = Math.max(min, Math.min(max, r));
  g = Math.max(min, Math.min(max, g));
  b = Math.max(min, Math.min(max, b));
  return [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function resolveOwnerRepo(
  cp: any,
): { owner: string; repo: string } | null {
  try {
    if (!cp || typeof cp !== "object") return null;
    // Direct fields
    const full = cp?.repository?.full_name || cp?.repo_full_name;
    if (typeof full === "string" && full.includes("/")) {
      const [owner, repo] = full.split("/");
      if (owner && repo) return { owner, repo };
    }
    // Nested under payload
    const p = cp?.payload || {};
    const fullNested = p?.repository?.full_name || p?.repo_full_name;
    if (typeof fullNested === "string" && fullNested.includes("/")) {
      const [owner, repo] = fullNested.split("/");
      if (owner && repo) return { owner, repo };
    }
    const html =
      cp?.repository?.html_url ||
      cp?.pull_request?.html_url ||
      cp?.issue?.html_url ||
      cp?.repo_html_url ||
      p?.repository?.html_url ||
      p?.pull_request?.html_url ||
      p?.issue?.html_url ||
      p?.repo_html_url;
    if (typeof html === "string") {
      const parsed = parseGithubEntity(html);
      if (parsed) return { owner: parsed.owner, repo: parsed.repo };
    }
    const labels = Array.isArray(cp?.set_labels) ? cp.set_labels : [];
    for (const entry of labels) {
      const ent = entry?.entity;
      if (typeof ent === "string") {
        const parsed = parseGithubEntity(ent);
        if (parsed) return { owner: parsed.owner, repo: parsed.repo };
      }
    }
    // Original event (both direct and nested under payload)
    const oeFull =
      cp?.original_event?.repository?.full_name ||
      p?.original_event?.repository?.full_name;
    if (typeof oeFull === "string" && oeFull.includes("/")) {
      const [owner, repo] = oeFull.split("/");
      if (owner && repo) return { owner, repo };
    }
    const oeHtml =
      cp?.original_event?.pull_request?.html_url ||
      cp?.original_event?.issue?.html_url ||
      p?.original_event?.pull_request?.html_url ||
      p?.original_event?.issue?.html_url;
    if (typeof oeHtml === "string") {
      const parsed = parseGithubEntity(oeHtml);
      if (parsed) return { owner: parsed.owner, repo: parsed.repo };
    }
    return null;
  } catch {
    return null;
  }
}

function inferEntityUrl(cp: any): string | null {
  try {
    const pr = cp?.pull_request;
    if (pr?.html_url) return String(pr.html_url);
    const issue = cp?.issue;
    if (issue?.html_url) return String(issue.html_url);
    const p = cp?.payload || {};
    if (p?.pull_request?.html_url) return String(p.pull_request.html_url);
    if (p?.issue?.html_url) return String(p.issue.html_url);
    const oe = cp?.original_event || p?.original_event;
    if (oe?.pull_request?.html_url) return String(oe.pull_request.html_url);
    if (oe?.issue?.html_url) return String(oe.issue.html_url);
    return null;
  } catch {
    return null;
  }
}

function resolvePkgSpec(cp: any): string {
  try {
    if (process.env.A5C_PKG_SPEC) return String(process.env.A5C_PKG_SPEC);
    // Attempt to read our own package name@version from the dist context
    // This file runs from dist; walk up to find package.json
    // let dir = process.cwd();
    // for (let i = 0; i < 5; i++) {
    //   const candidate = path.join(dir, "package.json");
    //   try {
    //     const raw = fs.readFileSync(candidate, "utf8");
    //     const pkg = JSON.parse(raw);
    //     const name = pkg?.name;
    //     const version = pkg?.version;
    //     if (name && version) return `${name}@${version}`;
    //     if (name) return String(name);
    //   } catch {}
    //   const parent = path.dirname(dir);
    //   if (parent === dir) break;
    //   dir = parent;
    // }
    if (cp.env && (cp.env as any).A5C_PKG_SPEC)
      return String((cp.env as any).A5C_PKG_SPEC);
    // (cp.env && (cp.env as any).A5C_PKG_SPEC) ||
  } catch {}
  // Fallback to published tag
  return "@a5c-ai/events";
}
