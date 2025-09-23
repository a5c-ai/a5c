import fs from "node:fs";
import { writeJSONFile, readJSONFile } from "./config.js";
import os from "node:os";
import path from "node:path";
import { redactObject } from "./utils/redact.js";
import { createLogger } from "./log.js";
import { spawn } from "node:child_process";
// parseGithubEntityUtil is re-exported below as parseGithubEntity for public API
import { parseGithubEntity as parseGithubEntityUtil } from "./utils/githubEntity.js";

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
    // Default sink: stdout. If --out is provided without --sink, treat as file.
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
    // Execute new actions format
    if (cp && Array.isArray(cp.actions) && cp.actions.length) {
      dbg(`execute actions count=${cp.actions.length}`);
      for (const action of cp.actions) {
        await executeOneAction(action, cp, scriptEnv, tmpEventPath);
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

async function executeOneAction(
  action: any,
  cp: any,
  baseEnv: Record<string, string>,
  _tmpEventPath: string,
): Promise<void> {
  const type = String(action?.type || "").trim();
  if (!type) return;
  // Built-in fast path for labeling
  if (type === "label_issue" || type === "label_pr") {
    const issueUrl = action?.params?.issue || action?.params?.entity;
    const add = Array.isArray(action?.params?.add_labels)
      ? action.params.add_labels
      : [];
    const remove = Array.isArray(action?.params?.remove_labels)
      ? action.params.remove_labels
      : [];
    if (issueUrl) {
      await applyLabels([
        { entity: String(issueUrl), add_labels: add, remove_labels: remove },
      ]);
    }
    return;
  }
  // emit_event is script-backed; no built-in to enforce uniformity
  if (type === "status_checks") {
    await actionStatusChecks(action, cp);
    return;
  }
  if (type === "add_comment") {
    await actionAddComment(action, cp);
    return;
  }
  if (type === "edit_comment") {
    await actionEditComment(action, cp);
    return;
  }
  if (type === "delete_comment") {
    await actionDeleteComment(action, cp);
    return;
  }
  if (type === "close_issue") {
    await actionCloseIssue(action, cp);
    return;
  }
  if (type === "close_pr") {
    await actionClosePr(action, cp);
    return;
  }
  if (type === "merge_pr") {
    await actionMergePr(action, cp);
    return;
  }
  // Script-backed action
  const scriptUri = String(action?.script_uri || "").trim();
  if (!scriptUri) {
    dbg(`skip action '${type}': missing script_uri`);
    return;
  }
  const scriptText = await fetchScriptText(scriptUri);
  if (!scriptText) {
    dbg(`skip action '${type}': script not found at ${scriptUri}`);
    return;
  }
  const scriptPath = writeTempScript(scriptText);
  const mergedEnv: Record<string, string> = {
    ...baseEnv,
    ...(normalizeActionEnv(action?.env) || {}),
    A5C_ACTION_TYPE: type,
    ACTION_TYPE: type,
    A5C_ACTION_PARAMS: JSON.stringify(action?.params || {}),
    ACTION_PARAMS_JSON: JSON.stringify(action?.params || {}),
    A5C_ACTION_SCRIPT_URI: scriptUri,
  };
  await new Promise<void>((resolve, reject) => {
    const child = spawn(scriptPath, {
      shell: "/bin/bash",
      stdio: "inherit",
      env: mergedEnv,
    });
    child.on("close", (code: any, signal: any) => {
      if (code === 0) return resolve();
      const reason =
        code != null ? `exit code ${code}` : signal ? `signal ${signal}` : "";
      reject(new Error(`action failed (${reason})`));
    });
    child.on("error", (err: any) => reject(err instanceof Error ? err : new Error(String(err))));
  });
}

function normalizeActionEnv(arr: any): Record<string, string> | undefined {
  if (!Array.isArray(arr)) return undefined;
  const out: Record<string, string> = {};
  for (const it of arr) {
    const name = String(it?.name || "").trim();
    if (!name) continue;
    out[name] = String(it?.value ?? "");
  }
  return Object.keys(out).length ? out : undefined;
}

function writeTempScript(content: string): string {
  try {
    const preferred = "/tmp/a5c-action.sh";
    fs.writeFileSync(preferred, content, { encoding: "utf8", mode: 0o755 });
    return preferred;
  } catch {}
  const dir = process.env.RUNNER_TEMP || process.env.TEMP || process.cwd();
  const p = path.join(dir, `a5c-action-${Date.now()}.sh`);
  try {
    fs.writeFileSync(p, content, { encoding: "utf8" });
    return p;
  } catch {
    return "bash"; // fallback to shell
  }
}

async function fetchScriptText(uri: string): Promise<string> {
  try {
    if (/^github:\/\//i.test(uri)) {
      const m = /^github:\/\/([^/]+)\/([^/]+)\/(?:branch|ref|version)\/([^/]+)\/(.+)$/i.exec(
        uri,
      );
      if (!m) return "";
      const owner = m[1];
      const repo = m[2];
      const ref = decodeURIComponent(m[3]);
      const filePath = decodeURIComponent(m[4]);
      const { Octokit } = await import("@octokit/rest");
      const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref });
      if (Array.isArray(data)) return "";
      const encoding = (data as any).encoding || "base64";
      return Buffer.from((data as any).content || "", encoding).toString("utf8");
    }
    if (/^file:\/\//i.test(uri)) {
      const p = new URL(uri).pathname;
      return fs.readFileSync(p, "utf8");
    }
    if (fs.existsSync(uri)) return fs.readFileSync(uri, "utf8");
    return "";
  } catch {
    return "";
  }
}

async function getOctokit(): Promise<any> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required for action");
  const { Octokit } = await import("@octokit/rest");
  return new Octokit({ auth: token });
}

async function actionAddComment(action: any, cp: any): Promise<void> {
  const body = String(action?.params?.comment || action?.params?.body || "");
  const issueUrl = action?.params?.issue || cp?.issue?.html_url || cp?.pull_request?.html_url;
  if (!issueUrl || !body) return;
  const parsed = parseGithubEntityUtil(String(issueUrl));
  if (!parsed || !parsed.owner || !parsed.repo || !parsed.number) return;
  const octokit = await getOctokit();
  await octokit.issues.createComment({
    owner: parsed.owner,
    repo: parsed.repo,
    issue_number: parsed.number,
    body,
  } as any);
}

async function actionEditComment(action: any, _cp: any): Promise<void> {
  const body = String(action?.params?.comment || action?.params?.body || "");
  const commentId = Number(action?.params?.comment_id || action?.params?.id);
  if (!commentId || !body) return;
  const octokit = await getOctokit();
  await octokit.issues.updateComment({
    comment_id: commentId,
    owner: String(action?.params?.owner || ""),
    repo: String(action?.params?.repo || ""),
    body,
  } as any);
}

async function actionDeleteComment(action: any, _cp: any): Promise<void> {
  const commentId = Number(action?.params?.comment_id || action?.params?.id);
  if (!commentId) return;
  const octokit = await getOctokit();
  await octokit.issues.deleteComment({
    comment_id: commentId,
    owner: String(action?.params?.owner || ""),
    repo: String(action?.params?.repo || ""),
  } as any);
}

async function actionCloseIssue(action: any, cp: any): Promise<void> {
  const issueUrl = action?.params?.issue || cp?.issue?.html_url;
  if (!issueUrl) return;
  const parsed = parseGithubEntityUtil(String(issueUrl));
  if (!parsed || !parsed.owner || !parsed.repo || !parsed.number) return;
  const octokit = await getOctokit();
  await octokit.issues.update({
    owner: parsed.owner,
    repo: parsed.repo,
    issue_number: parsed.number,
    state: "closed",
  } as any);
}

async function actionClosePr(action: any, cp: any): Promise<void> {
  const prUrl = action?.params?.pull_request || action?.params?.pr || cp?.pull_request?.html_url;
  if (!prUrl) return;
  const parsed = parseGithubEntityUtil(String(prUrl));
  if (!parsed || !parsed.owner || !parsed.repo || !parsed.number) return;
  const octokit = await getOctokit();
  await octokit.pulls.update({
    owner: parsed.owner,
    repo: parsed.repo,
    pull_number: parsed.number,
    state: "closed",
  } as any);
}

async function actionMergePr(action: any, cp: any): Promise<void> {
  const prUrl = action?.params?.pull_request || action?.params?.pr || cp?.pull_request?.html_url;
  if (!prUrl) return;
  const parsed = parseGithubEntityUtil(String(prUrl));
  if (!parsed || !parsed.owner || !parsed.repo || !parsed.number) return;
  const octokit = await getOctokit();
  await octokit.pulls.merge({
    owner: parsed.owner,
    repo: parsed.repo,
    pull_number: parsed.number,
    merge_method: String(action?.params?.method || "merge"),
  } as any);
}

async function actionStatusChecks(action: any, cp: any): Promise<void> {
  const name = String(action?.params?.name || action?.params?.context || "").trim();
  if (!name) return;
  const description = String(action?.params?.description || "");
  const statusParam = String(action?.params?.status || "queued").toLowerCase();
  const prUrl = action?.params?.pull_request_url || cp?.pull_request?.html_url;
  const parsed = prUrl ? parseGithubEntityUtil(String(prUrl)) : null;
  const octokit = await getOctokit();
  let owner = parsed?.owner;
  let repo = parsed?.repo;
  let sha = cp?.pull_request?.head?.sha || cp?.sha || cp?.after;
  if ((!owner || !repo) && cp?.repository?.full_name) {
    const parts = String(cp.repository.full_name).split("/");
    owner = parts[0];
    repo = parts[1];
  }
  if (!sha && cp?.head_commit?.id) sha = cp.head_commit.id;
  if (!owner || !repo || !sha) return;
  const state = statusParam === "success" || statusParam === "failure" || statusParam === "error" ? statusParam : (statusParam === "running" ? "pending" : "queued");
  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state: state === "queued" ? "pending" : (state as any),
    context: name,
    description,
  } as any);
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
  _cp: any,
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
    await new Promise<void>((resolve, reject) => {
      const child = spawn(cmd, {
        shell: "/bin/bash",
        stdio: "inherit",
        env: finalEnv,
      });
      child.on("close", (code: any, signal: any) => {
        if (code === 0) return resolve();
        const reason =
          code != null
            ? `exit code ${code}`
            : signal
              ? `signal ${signal}`
              : "unknown failure";
        reject(new Error(`script failed (${reason}): ${cmd}`));
      });
      child.on("error", (err: any) =>
        reject(err instanceof Error ? err : new Error(String(err))),
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
