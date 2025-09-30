import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { execFileSync } from "node:child_process";
import { readJSONFile } from "./config.js";
import { parseGithubOwnerRepo } from "./utils/githubEntity.js";
import { createLogger } from "./log.js";

export interface ReactorOptions {
  in?: string;
  out?: string;
  file?: string;
  branch?: string;
  metadataMatch?: Record<string, string>;
}

export interface ReactorOutputEvent {
  event_type: string;
  client_payload: any;
  original_event: any;
}

const logger = createLogger({ scope: "reactor" });
const logInfo = (msg: string, ctx?: Record<string, unknown>) =>
  logger.info(msg, ctx);
const logWarn = (msg: string, ctx?: Record<string, unknown>) =>
  logger.warn(msg, ctx);
const logDebug = (msg: string, ctx?: Record<string, unknown>) =>
  logger.debug(msg, ctx);

function isReactorDoc(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  const keys = new Set(Object.keys(obj));
  const hasOn = keys.has("on");
  const hasEmit = keys.has("emit");
  const hasCommands =
    keys.has("set_labels") || keys.has("pre_set_labels") || keys.has("script");
  const hasActions = keys.has("actions");
  return hasOn || hasEmit || hasCommands || hasActions;
}

export async function handleReactor(opts: ReactorOptions): Promise<{
  code: number;
  output?: { events: ReactorOutputEvent[] };
  errorMessage?: string;
}> {
  try {
    logInfo(`starting reactor (file=${opts.file || "(default)"})`);
    const inputObj = readInput(opts.in);
    const ne = normalizeNE(inputObj);
    const rulesPath = resolveRulesPath(opts.file);
    const branch = opts.branch || process.env.A5C_EVENT_CONFIG_BRANCH || "main";
    const rulesPathCodes = Array.from(String(rulesPath || "")).map((ch) =>
      ch.charCodeAt(0),
    );
    logDebug(
      `resolved rulesPath='${rulesPath}' branch=${branch} charCodes=${JSON.stringify(
        rulesPathCodes.slice(0, 200),
      )}`,
    );
    const repo = inferRepoFromNE(ne);
    if (repo) logDebug(`inferred repo=${repo.owner}/${repo.repo}`);

    const docs = await loadReactorDocs(ne, rulesPath, branch);
    logInfo(`loaded ${docs.length} reactor handler(s)`);

    const events: ReactorOutputEvent[] = [];
    const match = opts.metadataMatch || {};
    let idx = 0;
    for (const doc of docs) {
      idx++;
      if (!doc || typeof doc !== "object") continue;
      const source = (doc as any).__source || "(unknown)";
      logDebug(`eval handler#${idx} from ${source}`);
      const metadata = (doc as any).metadata || {};
      if (!metadataMatches(metadata, match)) {
        logDebug(
          `handler#${idx} filtered: metadata mismatch need=${JSON.stringify(
            match,
          )} have=${JSON.stringify(metadata)}`,
        );
        continue;
      }
      const onSpec: any = (doc as any).on;
      const emitSpec: any = (doc as any).emit;
      const actionsSpec: any[] = Array.isArray((doc as any).actions)
        ? (doc as any).actions
        : [];
      const docEnvSpec: any[] = Array.isArray((doc as any).env)
        ? (doc as any).env
        : [];
      const secrets: Record<string, string | undefined> = buildSecretsEnv();
      const varsEnv: Record<string, string | undefined> = buildVarsEnv();
      const docEnv = evaluateDocEnv(docEnvSpec, {
        event: ne.payload,
        env: process.env,
        secrets,
        vars: varsEnv,
      });
      const hasCommands =
        (Array.isArray((doc as any).pre_set_labels) &&
          (doc as any).pre_set_labels.length > 0) ||
        (Array.isArray((doc as any).script) &&
          (doc as any).script.length > 0) ||
        (Array.isArray((doc as any).set_labels) &&
          (doc as any).set_labels.length > 0);
      if (!onSpec && !emitSpec && !hasCommands && !actionsSpec.length) {
        logDebug(`handler#${idx} filtered: missing on/emit/commands`);
        continue;
      }
      const neWithEnv = withDocEnv(ne, docEnv, secrets, varsEnv);
      const dbgEvent = buildExpressionEvent((neWithEnv as any)?.payload);
      const dbgLabels = Array.isArray(dbgEvent?.labels)
        ? dbgEvent.labels
        : Array.isArray(dbgEvent?.pull_request?.labels)
          ? dbgEvent.pull_request.labels.map((x: any) => x?.name || x)
          : (neWithEnv as any)?.labels || [];
      logDebug(
        `handler#${idx} on=${JSON.stringify(onSpec)} event.type=${dbgEvent?.type} action=${dbgEvent?.action} labels=${JSON.stringify(dbgLabels)}`,
      );
      const explain = explainMatch(onSpec, neWithEnv);
      if (!explain.matched) {
        logDebug(`handler#${idx} filtered: ${explain.reason || "no match"}`);
        continue;
      }
      logDebug(`handler#${idx} matched`);
      if (emitSpec && typeof emitSpec === "object") {
        for (const [eventType, spec] of Object.entries(emitSpec)) {
          const payload = buildClientPayload(spec, neWithEnv);
          const merged = await attachDocCommands(payload, doc, neWithEnv);
          events.push({
            event_type: eventType,
            client_payload: merged,
            original_event: ne,
          });
        }
      } else if (!emitSpec && (hasCommands || actionsSpec.length)) {
        const payload = {};
        const merged = await attachDocCommands(payload, doc, neWithEnv);
        if (actionsSpec.length) {
          merged.actions = await materializeActions(actionsSpec, neWithEnv);
        }
        const eventType = "command_only";
        logDebug(
          `handler#${idx} produced command-only event (event_type=${eventType})`,
        );
        events.push({
          event_type: eventType,
          client_payload: merged,
          original_event: ne,
        });
      }
    }
    logInfo(`reactor produced ${events.length} event(s)`);
    return { code: 0, output: { events } };
  } catch (e: any) {
    const msg = String(e?.message || e);
    logWarn(`reactor failed: ${msg}`);
    return { code: 1, errorMessage: `reactor: ${msg}` };
  }
}

function explainMatch(
  onSpec: any,
  ne: ReturnType<typeof normalizeNE>,
): { matched: boolean; reason?: string } {
  const base = (ne as any)?.payload || {};
  const eventType = (ne as any)?.type || toStr((base as any)?.event);
  const action =
    toStr((base as any)?.action) ||
    toStr((base as any)?.event_type) ||
    toStr((base as any)?.client_payload?.event_type);
  if (typeof onSpec === "string") {
    const name = onSpec;
    const nameIsCustom = !KNOWN_GH_EVENTS.has(name) && name !== "any";
    if (!nameIsCustom && name !== "any" && eventType && eventType !== name) {
      return {
        matched: false,
        reason: `type mismatch need=${name} have=${eventType}`,
      };
    }
    if (nameIsCustom && action !== name) {
      return {
        matched: false,
        reason: `custom action mismatch need=${name} have=${action}`,
      };
    }
    return { matched: true };
  }
  if (Array.isArray(onSpec)) {
    let lastReason: string | undefined;
    for (const name of onSpec) {
      const r = explainMatch(name, ne);
      if (r.matched) return r;
      lastReason = r.reason;
    }
    return { matched: false, reason: lastReason || `none matched` };
  }
  if (onSpec && typeof onSpec === "object") {
    let lastReason: string | undefined;
    for (const [name, spec] of Object.entries(onSpec)) {
      const r = explainMatchOne(String(name), spec, ne);
      if (r.matched) return r;
      lastReason = r.reason;
    }
    return { matched: false, reason: lastReason || "no entry matched" };
  }
  return { matched: false, reason: "empty on spec" };
}

function explainMatchOne(
  name: string,
  spec: any,
  ne: ReturnType<typeof normalizeNE>,
): { matched: boolean; reason?: string } {
  const base = (ne as any)?.payload || {};
  const action =
    toStr((base as any)?.action) ||
    toStr((base as any)?.event_type) ||
    toStr((base as any)?.client_payload?.event_type);
  const evtType = (ne as any)?.type || toStr((base as any)?.event);
  const nameIsCustom = !KNOWN_GH_EVENTS.has(name) && name !== "any";
  if (!nameIsCustom && name !== "any" && evtType && evtType !== name)
    return {
      matched: false,
      reason: `type mismatch need=${name} have=${evtType}`,
    };
  if (nameIsCustom) {
    if (action !== name)
      return {
        matched: false,
        reason: `custom action mismatch need=${name} have=${action}`,
      };
  }
  if (!spec || typeof spec !== "object") return { matched: true };
  // skip/filter_out take precedence and negate matching when satisfied
  const skipSpec = (spec as any).skip ?? (spec as any).filter_out;
  if (skipSpec != null) {
    const shouldSkip = evaluateSkip(skipSpec, ne);
    if (shouldSkip) return { matched: false, reason: "skip matched" };
  }
  if (Array.isArray((spec as any).types) && KNOWN_GH_EVENTS.has(name)) {
    const set = new Set(((spec as any).types as any[]).map((v) => String(v)));
    if (!action || !set.has(action))
      return {
        matched: false,
        reason: `subtype mismatch need one of ${Array.from(set).join(",")}, have=${action}`,
      };
  }
  if (Array.isArray((spec as any).events)) {
    const set = new Set(((spec as any).events as any[]).map((v) => String(v)));
    if (!action || !set.has(action))
      return {
        matched: false,
        reason: `event mismatch need one of ${Array.from(set).join(",")}, have=${action}`,
      };
  }
  if (Array.isArray((spec as any).labels)) {
    const needed = new Set((spec as any).labels.map((v: any) => String(v)));
    const labelsSource = nameIsCustom
      ? normalizeLabels((base as any)?.client_payload?.labels)
      : (ne as any)?.labels || [];
    const missing: string[] = [];
    for (const l of Array.from(needed.values()) as string[])
      if (!labelsSource.includes(String(l))) missing.push(String(l));
    if (missing.length)
      return { matched: false, reason: `labels missing: ${missing.join(",")}` };
  }
  const phaseSpec = (spec as any).phase;
  if (phaseSpec) {
    const phase =
      toStr((base as any).phase) || toStr((base as any)?.client_payload?.phase);
    if (Array.isArray(phaseSpec)) {
      const set = new Set((phaseSpec as any[]).map((v) => String(v)));
      if (!phase || !set.has(phase))
        return {
          matched: false,
          reason: `phase mismatch need one of ${Array.from(set).join(",")}, have=${phase}`,
        };
    } else {
      if (!phase || String(phase) !== String(phaseSpec))
        return {
          matched: false,
          reason: `phase mismatch need=${phaseSpec} have=${phase}`,
        };
    }
  }
  const filters = (spec as any).filters;
  if (Array.isArray(filters) && filters.length) {
    const anyTrue = filters.some((f: any) => evaluateFilter(f, ne));
    if (!anyTrue) return { matched: false, reason: `filters not satisfied` };
  }
  return { matched: true };
}

function metadataMatches(
  meta: Record<string, any>,
  match: Record<string, string>,
): boolean {
  const entries = Object.entries(match || {});
  for (const [k, v] of entries) {
    if (v == null) continue;
    if (String(meta?.[k]) !== String(v)) return false;
  }
  return true;
}

function buildSecretsEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (
      k &&
      (k.startsWith("A5C_") ||
        k.startsWith("GITHUB_") ||
        k.startsWith("SECRET_") ||
        k === "GITHUB_TOKEN")
    ) {
      out[k] = v;
    }
  }
  return out;
}

function buildVarsEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (
      k &&
      (k.startsWith("A5C_") || k.startsWith("VAR_") || k === "A5C_MCPS_PATH")
    ) {
      out[k] = v;
    }
  }
  return out;
}

function withDocEnv(
  ne: ReturnType<typeof normalizeNE>,
  env: Record<string, string>,
  secrets: Record<string, any>,
  vars: Record<string, any>,
) {
  // Attach doc env into enriched.derived.flags for expression visibility; do not mutate input
  const copy: any = { ...ne };
  copy.enriched = { ...(ne as any).enriched };
  copy.enriched.derived = {
    ...((ne as any).enriched?.derived || {}),
    doc_env: env,
    secrets,
    vars,
  };
  return copy as ReturnType<typeof normalizeNE>;
}

function evaluateDocEnv(
  spec: any[],
  ctx: { event: any; env: any; secrets: any; vars: any },
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of spec) {
    const name = String(item?.name || "");
    if (!name) continue;
    const val = resolveTemplateString(String(item?.value ?? ""), {
      ...(normalizeNE({
        provider: "github",
        payload: ctx.event,
        labels: [],
        enriched: { derived: {} },
      }) as any),
      enriched: {
        derived: {
          flags: {},
          doc_env: out,
          secrets: ctx.secrets,
          vars: ctx.vars,
        },
      },
    } as any);
    out[name] = String(val ?? "");
  }
  return out;
}

async function loadReactorDocs(
  ne: ReturnType<typeof normalizeNE>,
  pathOrUri: string,
  branch: string,
): Promise<any[]> {
  if (/^github:\/\//i.test(pathOrUri)) {
    const parsed = parseGithubUri(pathOrUri);
    logDebug(`loadReactorDocs: github uri parsed=${JSON.stringify(parsed)}`);
    if (!parsed) return [];
    return await fetchGithubYamlDocs(
      parsed.owner,
      parsed.repo,
      parsed.ref,
      parsed.path,
    );
  }
  if (/^file:\/\//i.test(pathOrUri)) {
    const p = new URL(pathOrUri).pathname;
    logDebug(`loadReactorDocs: file uri path=${p}`);
    return loadYamlDocuments(p);
  }
  if (fs.existsSync(pathOrUri)) {
    const isDir = isDirectorySafe(pathOrUri);
    logDebug(
      `loadReactorDocs: local path exists (dir=${isDir}) -> ${pathOrUri}`,
    );
    return loadYamlDocuments(pathOrUri);
  }
  const repoInfo = inferRepoFromNE(ne);
  const ref = inferRefFromNE(ne) || branch;
  logDebug(
    `loadReactorDocs: remote from event repo=${JSON.stringify(repoInfo)} ref=${ref} path=${pathOrUri}`,
  );
  if (!repoInfo) return [];
  return await fetchGithubYamlDocs(
    repoInfo.owner,
    repoInfo.repo,
    ref,
    pathOrUri,
  );
}

function parseGithubUri(
  uri: string,
): { owner: string; repo: string; ref: string; path: string } | null {
  try {
    if (!/^github:\/\//i.test(uri)) return null;
    logDebug(
      `parseGithubUri: raw='${uri}' charCodes=${JSON.stringify(
        Array.from(String(uri || "")).map((ch) => ch.charCodeAt(0)).slice(0, 200),
      )}`,
    );
    const [, rest] = /^(github):\/\/(.+)$/i.exec(uri) || [];
    if (!rest) return null;
    const parts = rest.split("/");
    const owner = parts.shift();
    const repo = parts.shift();
    if (!owner || !repo || parts.length === 0) return null;

    const mode = (parts[0] || "").toLowerCase();
    if (mode === "branch" || mode === "ref" || mode === "version") {
      if (parts.length < 2) return null;
      const ref = decodeURIComponent(parts[1] || "");
      const pathSegments = parts.slice(2).map((seg) => decodeURIComponent(seg || ""));
      return { owner, repo, ref, path: pathSegments.join("/") };
    }

    for (let i = parts.length - 1; i >= 1; i--) {
      const refSegments = parts.slice(0, i).map((seg) => decodeURIComponent(seg || ""));
      const pathSegments = parts.slice(i).map((seg) => decodeURIComponent(seg || ""));
      const ref = refSegments.join("/");
      const path = pathSegments.join("/");
      if (ref && path) return { owner, repo, ref, path };
    }

    return null;
  } catch (e: any) {
    logWarn(`parseGithubUri failed: ${e?.message || e}`);
    return null;
  }
}

async function fetchGithubYamlDocs(
  owner: string,
  repo: string,
  ref: string,
  p: string,
): Promise<any[]> {
  try {
    const token =
      process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      logWarn("fetchGithubYamlDocs: missing token; skipping remote load");
      return [];
    }
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: token });
    const docs: any[] = [];
    const cleanRef = decodeURIComponent(ref || "");
    const basePath = normalizeRepoPathStr(decodeURIComponent(p || ""));
    const targets = computeRemotePaths(basePath);
    logInfo(
      `remote discovery from ${owner}/${repo}@${cleanRef} base='${basePath}' targets=${JSON.stringify(targets)}`,
    );
    for (const pathItem of targets) {
      await fetchGithubPath(octokit, owner, repo, cleanRef, pathItem, docs);
      if (docs.length) break;
    }
    logInfo(`remote discovery loaded ${docs.length} YAML doc(s)`);
    return docs;
  } catch (e: any) {
    logWarn(`fetchGithubYamlDocs failed: ${e?.message || e}`);
    return [];
  }
}

async function fetchGithubPath(
  octokit: any,
  owner: string,
  repo: string,
  ref: string,
  pathItem: string,
  docsOut: any[],
): Promise<void> {
  try {
    const normPath = normalizeRepoPathStr(pathItem);
    logDebug(`fetchGithubPath: GET contents path='${normPath}' ref='${ref}'`);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: normPath,
      ref,
    });
    if (Array.isArray(data)) {
      logDebug(`fetchGithubPath: directory entries=${data.length}`);
      for (const entry of data) {
        const type = (entry as any).type;
        const name = (entry as any).name || "";
        const p = (entry as any).path || "";
        if (type === "dir") {
          await fetchGithubPath(octokit, owner, repo, ref, p, docsOut);
        } else if (
          type === "file" &&
          (name.endsWith(".yaml") || name.endsWith(".yml"))
        ) {
          await fetchGithubPath(octokit, owner, repo, ref, p, docsOut);
        }
      }
      return;
    }
    const name = (data as any).name || "";
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) return;
    const encoding = (data as any).encoding || "base64";
    const content: string = Buffer.from(
      (data as any).content || "",
      encoding,
    ).toString("utf8");
    const parsed = YAML.parseAllDocuments(content, { prettyErrors: false });
    let docIdx = 0;
    for (const d of parsed as any[]) {
      try {
        const obj = (d as any).toJSON();
        if (isReactorDoc(obj)) {
          (obj as any).__source = `${normPath}#${docIdx}`;
          docsOut.push(obj);
        }
      } catch {}
      docIdx++;
    }
    logDebug(
      `fetchGithubPath: parsed YAML file '${name}' (docsOut=${docsOut.length})`,
    );
  } catch (e: any) {
    logDebug(`fetchGithubPath error: ${e?.message || e}`);
  }
}

function normalizeRepoPathStr(p: string): string {
  const s = String(p || "");
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

function inferRefFromGithubEvent(event: any): string | undefined {
  const type = event?.type;
  if (type === "pull_request") {
    return event?.payload?.pull_request?.head?.ref;
  }
  if (type === "workflow_job") {
    return event?.payload?.workflow_job?.head_branch;
  }
  if (type === "workflow_run") {
    return event?.payload?.workflow_run?.head_branch;
  }
  if (type === "check_run") {
    return event?.payload?.check_run?.head_branch;
  }
  if (type === "check_suite") {
    return event?.payload?.check_suite?.head_branch;
  }
  return event?.payload?.ref;
}
function inferRefFromNE(
  ne: ReturnType<typeof normalizeNE>,
): string | undefined {
  // by type of github event  
  try {
    const ref = inferRefFromGithubEvent(ne as any);
    if (typeof ref === "string" && ref.length)
      return ref.replace(/^refs\/heads\//, "");
    return undefined;
  } catch {
    return undefined;
  }
}

function readInput(inPath?: string): any {
  if (inPath) return readJSONFile(inPath);
  const raw = fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function resolveRulesPath(fileOpt?: string): string {
  const raw = fileOpt ?? ".a5c/events/";
  const p = typeof raw === "string" ? raw.trim() : String(raw || "");
  if (!p) return ".a5c/events/";
  // Preserve URI forms like github:// and file:// — don't path.resolve them
  if (/^[a-zA-Z]+:\/\//.test(p)) return p;
  if (path.isAbsolute(p)) return p;
  return p.replace(/^\.\/+/, "");
}

function loadYamlDocuments(filePath: string): any[] {
  const files: string[] = isDirectorySafe(filePath)
    ? walkYamlFiles(filePath)
    : [filePath];
  const out: any[] = [];
  for (const fp of files) {
    const raw = fs.readFileSync(fp, "utf8");
    const docs = YAML.parseAllDocuments(raw, { prettyErrors: false });
    let docIdx = 0;
    for (const d of docs as any[]) {
      try {
        const obj = (d as any).toJSON();
        if (isReactorDoc(obj)) {
          (obj as any).__source = `${fp}#${docIdx}`;
          out.push(obj);
        }
      } catch {}
      docIdx++;
    }
  }
  logDebug(`loadYamlDocuments: loaded ${out.length} from local '${filePath}'`);
  return out;
}

function isDirectorySafe(p: string): boolean {
  try {
    const st = fs.statSync(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

function walkYamlFiles(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walkYamlFiles(full));
    } else if (
      e.isFile() &&
      (full.endsWith(".yaml") || full.endsWith(".yml"))
    ) {
      out.push(full);
    }
  }
  return out;
}

function normalizeNE(input: any): {
  provider?: string;
  type?: string;
  payload: any;
  labels: string[];
  enriched?: any;
} {
  const isNE =
    input && typeof input === "object" && input.provider && input.payload;
  if (isNE) {
    const labels: string[] = Array.isArray(input.labels) ? input.labels : [];
    return {
      provider: input.provider,
      type: input.type,
      payload: input.payload,
      labels,
      enriched: input.enriched,
    };
  }
  const labels: string[] = Array.isArray(input?.labels) ? input.labels : [];
  return {
    provider: undefined,
    type: undefined,
    payload: input,
    labels,
    enriched: undefined,
  };
}

// matchesAnyTrigger is unused; kept for reference but commented out to avoid linter noise
// function matchesAnyTrigger(
//   onSpec: any,
//   ne: ReturnType<typeof normalizeNE>,
// ): boolean {
//   if (typeof onSpec === "string") return matchesTrigger(onSpec, undefined, ne);
//   if (Array.isArray(onSpec)) {
//     return onSpec.some((name) => matchesTrigger(String(name), undefined, ne));
//   }
//   if (onSpec && typeof onSpec === "object") {
//     for (const [name, spec] of Object.entries(onSpec)) {
//       if (matchesTrigger(String(name), spec, ne)) return true;
//     }
//   }
//   return false;
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function matchesTrigger(
  name: string,
  spec: any,
  ne: ReturnType<typeof normalizeNE>,
): boolean {
  const base = ne.payload || {};
  const action =
    toStr(base.action) ||
    toStr(base.event_type) ||
    toStr((base as any)?.client_payload?.event_type);
  const eventType =
    (ne as any)?.type || toStr((base as any)?.event) || undefined;

  // Custom event name: alias by action only
  const nameIsCustom = !KNOWN_GH_EVENTS.has(name) && name !== "any";
  if (nameIsCustom) {
    if (action !== name) return false;
  } else {
    if (name !== "any" && eventType && eventType !== name) return false;
  }

  if (!spec || typeof spec !== "object") return true;
  // skip/filter_out take precedence; if true -> do not match
  const skipSpec = (spec as any).skip ?? (spec as any).filter_out;
  if (skipSpec != null && evaluateSkip(skipSpec, ne)) return false;
  if (Array.isArray((spec as any).types) && KNOWN_GH_EVENTS.has(name)) {
    const set = new Set(((spec as any).types as any[]).map((v) => String(v)));
    if (!action || !set.has(action)) return false;
  }
  if (Array.isArray((spec as any).events)) {
    const set = new Set(((spec as any).events as any[]).map((v) => String(v)));
    if (!action || !set.has(action)) return false;
  }
  if (Array.isArray((spec as any).labels)) {
    const needed = new Set((spec as any).labels.map((v: any) => String(v)));
    const labelsSource = nameIsCustom
      ? normalizeLabels((base as any)?.client_payload?.labels)
      : (ne as any)?.labels || [];
    for (const l of Array.from(needed.values()) as string[])
      if (!labelsSource.includes(String(l))) return false;
  }
  const phaseSpec = (spec as any).phase;
  if (phaseSpec) {
    const phase =
      toStr((base as any).phase) || toStr((base as any)?.client_payload?.phase);
    if (Array.isArray(phaseSpec)) {
      const set = new Set((phaseSpec as any[]).map((v) => String(v)));
      if (!phase || !set.has(phase)) return false;
    } else {
      if (!phase || String(phase) !== String(phaseSpec)) return false;
    }
  }
  const filters = (spec as any).filters;
  if (Array.isArray(filters) && filters.length) {
    const anyTrue = filters.some((f: any) => evaluateFilter(f, ne));
    if (!anyTrue) return false;
  }
  return true;
}

const KNOWN_GH_EVENTS = new Set([
  "push",
  "pull_request",
  "issues",
  "issue",
  "issue_comment",
  "workflow_run",
  "repository_dispatch",
  "schedule",
  "workflow_dispatch",
  "check_run",
  "check_suite",
  "deployment",
  "deployment_status",
  "fork",
  "gollum",
]);

function buildClientPayload(
  spec: any,
  neCtx: ReturnType<typeof normalizeNE>,
): any {
  if (!spec || typeof spec !== "object") return {};
  const out: any = {};
  // Pass through common fields if provided under emit spec
  if (spec.type != null) out.type = spec.type;
  if (spec.phase != null) out.phase = spec.phase;
  if (spec.labels != null) out.labels = spec.labels;
  // Merge computed payload
  if (spec.payload != null) out.payload = resolveTemplates(spec.payload, neCtx);
  return out;
}

async function attachDocCommands(
  payload: any,
  doc: any,
  neCtx: ReturnType<typeof normalizeNE>,
): Promise<any> {
  const out = { ...(payload || {}) } as any;
  const exprEvent = buildExpressionEvent((neCtx as any)?.payload);
  // Materialize agent_run (env + optional script) before other steps
  const agentMat = await materializeAgentRun(doc, neCtx);
  // pre_set_labels first
  if (
    Array.isArray((doc as any).pre_set_labels) &&
    (doc as any).pre_set_labels.length
  ) {
    const resolved = resolveTemplates((doc as any).pre_set_labels, neCtx);
    out.pre_set_labels = Array.isArray(resolved)
      ? resolved.map((e: any) => ({
          ...e,
          entity:
            e?.entity ||
            exprEvent?.pull_request?.html_url ||
            exprEvent?.issue?.html_url ||
            e?.entity ||
            null,
        }))
      : resolved;
  }
  // then script: render script from template if provided, then append inline script
  const scriptParts: string[] = [];
  if (agentMat?.script && String(agentMat.script).trim().length)
    scriptParts.push(String(agentMat.script));
  const tplUri = (doc as any).script_template_uri;
  if (typeof tplUri === "string" && tplUri.trim().length) {
    const rendered = await renderScriptTemplate(tplUri.trim(), neCtx);
    if (rendered) scriptParts.push(rendered);
  }
  if (Array.isArray((doc as any).script) && (doc as any).script.length) {
    const inline = resolveTemplates((doc as any).script, neCtx);
    if (Array.isArray(inline)) {
      for (const s of inline) scriptParts.push(String(s));
    } else if (inline != null) {
      scriptParts.push(String(inline));
    }
  }
  if (scriptParts.length) out.script = scriptParts;
  // then set_labels
  if (
    Array.isArray((doc as any).set_labels) &&
    (doc as any).set_labels.length
  ) {
    const resolved = resolveTemplates((doc as any).set_labels, neCtx);
    out.set_labels = Array.isArray(resolved)
      ? resolved.map((e: any) => ({
          ...e,
          entity:
            e?.entity ||
            exprEvent?.pull_request?.html_url ||
            exprEvent?.issue?.html_url ||
            e?.entity ||
            null,
        }))
      : resolved;
  }
  // propagate env (evaluated earlier into neCtx.enriched.derived.doc_env)
  const docEnv = (neCtx as any)?.enriched?.derived?.doc_env;
  if (docEnv && typeof docEnv === "object") {
    out.env = { ...docEnv };
  }
  // merge agent_run derived envs (lower precedence than explicit env from doc)
  if (agentMat?.env && typeof agentMat.env === "object") {
    out.env = { ...(agentMat.env || {}), ...(out.env || {}) };
  }
  // Attach rendered actions if doc provided them
  if (Array.isArray((doc as any).actions) && (doc as any).actions.length) {
    out.actions = await materializeActions((doc as any).actions, neCtx);
  }
  // provide helpful context for downstream emit inference when needed
  if (!out.pull_request && exprEvent?.pull_request)
    out.pull_request = exprEvent.pull_request;
  if (!out.issue && exprEvent?.issue) out.issue = exprEvent.issue;
  return out;
}

async function materializeActions(
  actions: any[],
  neCtx: ReturnType<typeof normalizeNE>,
): Promise<any[]> {
  const out: any[] = [];
  for (const a of actions || []) {
    if (!a || typeof a !== "object") continue;
    const type = String(a.type || "").trim();
    if (!type) continue;
    const params = resolveTemplates(a.params || {}, neCtx);
    const envArr = Array.isArray(a.env) ? a.env : [];
    const envObj: Record<string, string> = {};
    for (const item of envArr) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      envObj[name] = String(resolveTemplates(item?.value ?? "", neCtx) ?? "");
    }
    const action: any = { type, params, ...(Object.keys(envObj).length ? { env: envObj } : {}) };
    // Map action type to script uri if applicable
    const scriptUri = inferActionScriptUri(type, neCtx);
    if (scriptUri) action.script_uri = scriptUri;
    out.push(action);
  }
  return out;
}

function inferActionScriptUri(
  type: string,
  neCtx: ReturnType<typeof normalizeNE>,
): string | null {
  try {
    // Convention: .a5c/scripts/actions/<type>.sh in the same repo by default
    const repo = (neCtx as any)?.payload?.repository?.full_name;
    if (!repo) return null;
    const ref = inferRefFromNE(neCtx) || process.env.A5C_EVENT_CONFIG_BRANCH || "a5c/main";
    const path = `.a5c/scripts/actions/${type}.sh`;
    return `github://${repo}/branch/${encodeURIComponent(ref)}/${path}`;
  } catch {
    return null;
  }
}

function resolveTemplates(node: any, ctx: ReturnType<typeof normalizeNE>): any {
  if (node == null) return node;
  if (typeof node === "string") return resolveTemplateString(node, ctx);
  if (Array.isArray(node)) return node.map((n) => resolveTemplates(n, ctx));
  if (typeof node === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(node))
      out[k] = resolveTemplates(v, ctx);
    return out;
  }
  return node;
}

const TMPL_RE = /^\s*\$\{\{\s*([^}]+)\s*\}\}\s*$/;
function resolveTemplateString(
  s: string,
  ctx: ReturnType<typeof normalizeNE>,
): any {
  // Full-string template
  const m = TMPL_RE.exec(s);
  if (m) {
    const expr = m[1];
    try {
      const compiled = preprocessExpression(expr);
      const eventArg = buildExpressionEvent((ctx as any)?.payload);
      const vars = (ctx as any)?.enriched?.derived?.vars || {};
      const secrets = (ctx as any)?.enriched?.derived?.secrets || {};
      const fn = new Function(
        "event",
        "ne",
        "env",
        "vars",
        "secrets",
        "read_github_content",
        "load_yaml",
        "select",
        `return (${compiled});`,
      );
      return fn(
        eventArg,
        { ...ctx },
        process.env,
        vars,
        secrets,
        readGithubContentSync,
        loadYAMLHelper,
        selectHelper,
      );
    } catch {
      return null;
    }
  }
  // Inline replacements
  return s.replace(/\$\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
    try {
      const compiled = preprocessExpression(String(expr));
      const eventArg = buildExpressionEvent((ctx as any)?.payload);
      const vars = (ctx as any)?.enriched?.derived?.vars || {};
      const secrets = (ctx as any)?.enriched?.derived?.secrets || {};
      const fn = new Function(
        "event",
        "ne",
        "env",
        "vars",
        "secrets",
        "read_github_content",
        "load_yaml",
        "select",
        `return (${compiled});`,
      );
      const v = fn(
        eventArg,
        { ...ctx },
        process.env,
        vars,
        secrets,
        readGithubContentSync,
        loadYAMLHelper,
        selectHelper,
      );
      return v == null ? "" : String(v);
    } catch {
      return "";
    }
  });
}

function buildExpressionEvent(base: any): any {
  try {
    const e: any = base && typeof base === "object" ? { ...base } : {};
    // Promote nested original_event for convenience in expressions
    const oe =
      e?.client_payload?.payload?.original_event ||
      e?.client_payload?.original_event;
    if (oe && typeof oe === "object") {
      for (const k of [
        "pull_request",
        "issue",
        "repository",
        "labels",
        "action",
        "type",
        "phase",
      ]) {
        if (e[k] == null && oe[k] != null) e[k] = oe[k];
      }
      // Derive type from original_event shape first
      if (e.type == null) {
        if (oe.pull_request) e.type = "pull_request";
        else if (oe.issue) e.type = "issue";
      }
      if (e.action == null && typeof oe.action === "string")
        e.action = oe.action;
    }
    // Promote labels to a flat array of strings at e.labels
    const prLabels = Array.isArray(e?.pull_request?.labels)
      ? e.pull_request.labels
          .map((x: any) => (x && typeof x === "object" ? x.name : x))
          .filter(Boolean)
      : [];
    const issueLabels = Array.isArray(e?.issue?.labels)
      ? e.issue.labels
          .map((x: any) => (x && typeof x === "object" ? x.name : x))
          .filter(Boolean)
      : [];
    const cpLabels = Array.isArray(e?.client_payload?.labels)
      ? (e.client_payload.labels as any[])
          .map((x: any) => (x && typeof x === "object" ? x.name : x))
          .filter(Boolean)
      : [];
    const promotedLabels = Array.from(
      new Set(
        [...(e.labels || []), ...prLabels, ...issueLabels, ...cpLabels].map(
          (v: any) => String(v),
        ),
      ),
    );
    if (promotedLabels.length) e.labels = promotedLabels;

    // Fallback type from action when still unset
    if (e && e.type == null) {
      e.type =
        e.action ||
        e.event_type ||
        (e.client_payload && e.client_payload.event_type) ||
        undefined;
    }
    return e;
  } catch {
    return base;
  }
}

function evaluateFilter(
  filter: any,
  neCtx: ReturnType<typeof normalizeNE>,
): boolean {
  if (!filter) return false;
  const expr = (filter as any).expression;
  if (typeof expr !== "string" || !expr.trim()) return false;
  const value = resolveTemplateString(expr, neCtx);
  return Boolean(value);
}

function evaluateSkip(
  skipSpec: any,
  neCtx: ReturnType<typeof normalizeNE>,
): boolean {
  try {
    const arr = Array.isArray(skipSpec) ? skipSpec : [skipSpec];
    for (const it of arr) {
      if (it == null) continue;
      if (typeof it === "string") {
        if (evaluateFilter({ expression: it }, neCtx)) return true;
      } else if (typeof it === "object") {
        if (evaluateFilter(it, neCtx)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function preprocessExpression(expr: string): string {
  // Transform simple pipeline syntax: a.b | map(name) | contains('x')
  // into: (a.b).map(x => x.name).includes('x')
  const parts = splitByLogical(expr);
  const out: string[] = [];
  for (const p of parts) {
    if (p === "&&" || p === "||") {
      out.push(p);
      continue;
    }
    if (p.includes("|")) out.push(transformPipeline(p));
    else out.push(p);
  }
  return out.join(" ");
}

function splitByLogical(expr: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    const next = expr[i + 1];
    if (ch === "&" && next === "&") {
      if (cur.trim()) tokens.push(cur.trim());
      tokens.push("&&");
      cur = "";
      i++;
    } else if (ch === "|" && next === "|") {
      if (cur.trim()) tokens.push(cur.trim());
      tokens.push("||");
      cur = "";
      i++;
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens;
}

function transformPipeline(segment: string): string {
  const tokens = segment
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!tokens.length) return segment;
  let expr = tokens[0];
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    const mapMatch = /^map\(([^)]+)\)$/.exec(t);
    if (mapMatch) {
      const prop = mapMatch[1].trim();
      // support map(name) -> .map(x => x.name)
      const accessor = /[^a-zA-Z0-9_]/.test(prop)
        ? `[${JSON.stringify(prop)}]`
        : `.${prop}`;
      expr = `(${expr}).map(x => x${accessor})`;
      continue;
    }
    const mapAttrMatch = /^map\(attribute=['\"]([^'\"]+)['\"]\)$/.exec(t);
    if (mapAttrMatch) {
      const prop = mapAttrMatch[1].trim();
      const accessor = /[^a-zA-Z0-9_]/.test(prop)
        ? `[${JSON.stringify(prop)}]`
        : `.${prop}`;
      expr = `(${expr}).map(x => x${accessor})`;
      continue;
    }
    const mapAttrNoQuoteMatch = /^map\(attribute=([^\)]+)\)$/.exec(t);
    if (mapAttrNoQuoteMatch) {
      const raw = mapAttrNoQuoteMatch[1].trim();
      const prop = raw.replace(/^['\"]/, "").replace(/['\"]$/, "");
      const accessor = /[^a-zA-Z0-9_]/.test(prop)
        ? `[${JSON.stringify(prop)}]`
        : `.${prop}`;
      expr = `(${expr}).map(x => x${accessor})`;
      continue;
    }
    const containsMatch = /^contains\((.+)\)$/.exec(t);
    if (containsMatch) {
      const arg = containsMatch[1].trim();
      expr = `(${expr}).includes(${arg})`;
      continue;
    }
    const joinMatch = /^join\((.+)\)$/.exec(t);
    if (joinMatch) {
      const arg = joinMatch[1].trim();
      expr = `(${expr}).join(${arg})`;
      continue;
    }
    const loadYamlMatch =
      /^load_yaml\(\)$/.exec(t) || t === "load_yaml" ? ["load_yaml"] : null;
    if (loadYamlMatch) {
      expr = `load_yaml(${expr})`;
      continue;
    }
    const selectMatch = /^select\((.+)\)$/.exec(t);
    if (selectMatch) {
      const arg = selectMatch[1].trim();
      expr = `select(${expr}, ${arg})`;
      continue;
    }
    // Unknown operator, keep as-is
    expr = `${expr}`;
  }
  return expr;
}

function inferRepoFromNE(
  ne: ReturnType<typeof normalizeNE>,
): { owner: string; repo: string } | null {
  try {
    const full = (ne as any)?.payload?.repository?.full_name;
    if (typeof full === "string" && full.includes("/")) {
      const [owner, repo] = full.split("/");
      if (owner && repo) return { owner, repo };
    }
    const url = (ne as any)?.payload?.repository?.html_url;
    if (typeof url === "string") {
      const parsed = parseGithubOwnerRepo(url);
      if (parsed) return { owner: parsed.owner, repo: parsed.repo };
    }
    return null;
  } catch {
    return null;
  }
}

function computeRemotePaths(localPath: string): string[] {
  // Normalize input; if a directory, look for typical reactor locations
  const relRaw = decodeURIComponent(localPath || "");
  const isDir = relRaw.endsWith("/");
  const rel = normalizeRepoPathStr(relRaw);
  const candidates: string[] = [];
  if (!rel || rel === "/") {
    return candidates;
  }
  if (isDir) {
    // If a directory path is provided, try directory itself (recursive) and '<dir>/reactor.yaml'
    candidates.push(rel);
  } else {
    candidates.push(rel);
  }
  return Array.from(new Set(candidates));
}

// Removed in favor of shared helper in src/utils/githubEntity.ts

function toStr(v: any): string | undefined {
  if (v == null) return undefined;
  return String(v);
}

function normalizeLabels(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v))
    return v.map((x) =>
      String(
        typeof x === "object" && x && (x as any).name ? (x as any).name : x,
      ),
    );
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function renderScriptTemplate(
  rawUri: string,
  neCtx: ReturnType<typeof normalizeNE>,
): Promise<string | null> {
  try {
    const uri = resolveTemplates(rawUri, neCtx);
    if (typeof uri !== "string" || !uri.trim()) return null;
    // Reuse generate_context fetchers via lightweight inline fetch
    if (/^github:\/\//i.test(uri)) {
      const parsed = parseGithubUri(uri);
      if (!parsed) return null;
      const text = await fetchGithubFileText(
        parsed.owner,
        parsed.repo,
        parsed.ref,
        parsed.path,
      );
      return String(text || "");
    }
    if (/^file:\/\//i.test(uri)) {
      const p = new URL(uri).pathname;
      return fs.readFileSync(p, "utf8");
    }
    // local relative path
    if (fs.existsSync(uri)) return fs.readFileSync(uri, "utf8");
    return null;
  } catch {
    return null;
  }
}

async function fetchGithubFileText(
  owner: string,
  repo: string,
  ref: string,
  filePath: string,
): Promise<string> {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref,
  });
  if (Array.isArray(data)) return "";
  const encoding = (data as any).encoding || "base64";
  const content: string = Buffer.from(
    (data as any).content || "",
    encoding,
  ).toString("utf8");
  return content;
}

// Helper functions available to expression evaluation
function readGithubContentSync(
  repoHtmlUrlOrOwnerRepo: string,
  ref: string,
  filePath: string,
): string {
  try {
    const token =
      process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    const parsed = parseGithubOwnerRepo(String(repoHtmlUrlOrOwnerRepo));
    const owner = parsed?.owner;
    const repo = parsed?.repo;
    if (!owner || !repo || !ref || !filePath) return "";
    const clean = String(filePath).replace(/^\/+/, "");
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(
      ref,
    )}/${clean}`;
    const args = ["-sSL", url];
    if (token) args.splice(0, 0, "-H", `Authorization: Bearer ${token}`);
    const buf = execFileSync("curl", args, {
      stdio: ["ignore", "pipe", "ignore"],
    });
    return buf.toString("utf8");
  } catch {
    return "";
  }
}

function loadYAMLHelper(s: string): any {
  try {
    if (s == null) return null;
    // load first document by default; if multiple docs, return array
    const docs = YAML.parseAllDocuments(String(s), { prettyErrors: false });
    if (!docs || !docs.length) return null;
    if (docs.length === 1) return (docs[0] as any).toJSON();
    return docs.map((d: any) => d.toJSON());
  } catch {
    return null;
  }
}

function selectHelper(obj: any, pathExpr: string): any {
  try {
    const p = String(pathExpr || "").trim();
    if (!p) return obj;
    const parts = p.split(".");
    let cur: any = obj;
    for (const key of parts) {
      if (cur == null) return undefined;
      cur = cur[key as any];
    }
    return cur;
  } catch {
    return undefined;
  }
}

async function materializeAgentRun(
  doc: any,
  neCtx: ReturnType<typeof normalizeNE>,
): Promise<{ env?: Record<string, string>; script?: string } | null> {
  try {
    const spec = (doc as any).agent_run;
    if (!spec || typeof spec !== "object") return null;
    const eventArg = buildExpressionEvent((neCtx as any)?.payload);
    const baseEnv: Record<string, string> = {};
    // Merge explicit envs from doc first
    const docEnv = Array.isArray((doc as any).env) ? (doc as any).env : [];
    for (const item of docEnv) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      baseEnv[name] = String(resolveTemplates(item?.value ?? "", neCtx) ?? "");
    }
    // Then agent_run.envs (lower priority; will be overridden by docEnv)
    const addEnv = Array.isArray((spec as any).envs) ? (spec as any).envs : [];
    for (const item of addEnv) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      if (baseEnv[name] == null)
        baseEnv[name] = String(
          resolveTemplates(item?.value ?? "", neCtx) ?? "",
        );
    }
    // Compute defaults
    const vars = (neCtx as any)?.enriched?.derived?.vars || {};
    const envProc = process.env;
    const full_repo = (neCtx as any)?.payload?.repository?.full_name;
    const ref = inferRefFromNE(neCtx) || process.env.A5C_EVENT_CONFIG_BRANCH || "a5c/main";
    const template =
      baseEnv.A5C_TEMPLATE_URI ||
      envProc.A5C_TEMPLATE_URI ||
      // vars.A5C_TEMPLATE_URI ||
      eventArg?.client_payload?.template ||
      `github://${full_repo}/branch/${encodeURIComponent(ref)}/.a5c/main.md`;
    const mcps =
      baseEnv.A5C_MCPS_PATH ||
      // vars.A5C_MCPS_PATH ||
      envProc.A5C_MCPS_PATH ||
      ".a5c/mcps.json";
    const profile =
      baseEnv.A5C_CLI_PROFILE || vars.A5C_CLI_PROFILE || "openai_codex_gpt5";
    const scriptTpl =
      (spec as any).script_template_uri ||
      baseEnv.A5C_AGENT_SCRIPT_URI ||
      envProc.A5C_AGENT_SCRIPT_URI ||
      // vars.A5C_AGENT_SCRIPT_URI ||
      "github://a5c-ai/a5c/branch/a5c%2Fmain/.a5c/scripts/agent.sh";
    const envOut = {
      ...envProc,
      ...baseEnv,
      A5C_TEMPLATE_URI: String(template),
      A5C_MCPS_PATH: String(mcps),
      A5C_CLI_PROFILE: String(profile),
    } as Record<string, string>;
    let script: string | undefined;
    if (scriptTpl && String(scriptTpl).trim().length) {
      const rendered = await renderScriptTemplate(
        String(scriptTpl).trim(),
        neCtx,
      );
      if (rendered) script = rendered;
    }
    return { env: envOut, script };
  } catch (error) {
    logWarn("Error materializing agent run", { error: error });
    return null;
  }
}
