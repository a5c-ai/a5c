import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { readJSONFile } from "./config.js";

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
}

// Lightweight logging helpers (GitHub Actions compatible)
const LOG_LEVEL = String(process.env.A5C_LOG_LEVEL || "info").toLowerCase();
const IS_ACTIONS =
  String(process.env.GITHUB_ACTIONS || "").toLowerCase() === "true";
function logInfo(msg: string) {
  const line = IS_ACTIONS ? `::notice::${msg}` : `[reactor] ${msg}`;
  process.stderr.write(line + "\n");
}
function logWarn(msg: string) {
  const line = IS_ACTIONS ? `::warning::${msg}` : `[reactor] WARN: ${msg}`;
  process.stderr.write(line + "\n");
}
function logDebug(msg: string) {
  if (!(LOG_LEVEL === "debug" || LOG_LEVEL === "trace")) return;
  const line = IS_ACTIONS ? `::debug::${msg}` : `[reactor] DEBUG: ${msg}`;
  process.stderr.write(line + "\n");
}

function isReactorDoc(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  const keys = new Set(Object.keys(obj));
  const interesting = [
    "on",
    "emit",
    "set_labels",
    "pre_set_labels",
    "script",
    "metadata",
    "env",
  ];
  return interesting.some((k) => keys.has(k));
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
    logDebug(`resolved rulesPath=${rulesPath}, branch=${branch}`);
    const repo = inferRepoFromNE(ne);
    if (repo) logDebug(`inferred repo=${repo.owner}/${repo.repo}`);

    const docs = await loadReactorDocs(ne, rulesPath, branch);
    logInfo(`loaded ${docs.length} reactor handler(s)`);

    const events: ReactorOutputEvent[] = [];
    const match = opts.metadataMatch || {};
    for (const doc of docs) {
      if (!doc || typeof doc !== "object") continue;
      const metadata = (doc as any).metadata || {};
      if (!metadataMatches(metadata, match)) {
        logDebug(`doc filtered by metadata (needed=${JSON.stringify(match)})`);
        continue;
      }
      const onSpec: any = (doc as any).on;
      const emitSpec: any = (doc as any).emit;
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
      if (!onSpec || !emitSpec) continue;
      const matched = matchesAnyTrigger(
        onSpec,
        withDocEnv(ne, docEnv, secrets, varsEnv),
      );
      logDebug(`doc matched=${matched}`);
      if (!matched) continue;
      if (emitSpec && typeof emitSpec === "object") {
        for (const [eventType, spec] of Object.entries(emitSpec)) {
          const payload = buildClientPayload(
            spec,
            withDocEnv(ne, docEnv, secrets, varsEnv),
          );
          const merged = attachDocCommands(
            payload,
            doc,
            withDocEnv(ne, docEnv, secrets, varsEnv),
          );
          events.push({ event_type: eventType, client_payload: merged });
        }
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
    const m =
      /^github:\/\/([^/]+)\/([^/]+)\/(?:branch|ref|version)\/([^/]+)\/(.+)$/i.exec(
        uri,
      );
    if (!m) return null;
    const [, owner, repo, refRaw, pRaw] = m;
    const ref = decodeURIComponent(refRaw);
    const p = decodeURIComponent(pRaw);
    return { owner, repo, ref, path: p };
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
    for (const d of parsed as any[]) {
      try {
        const obj = (d as any).toJSON();
        if (isReactorDoc(obj)) docsOut.push(obj);
      } catch {}
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

function inferRefFromNE(
  ne: ReturnType<typeof normalizeNE>,
): string | undefined {
  try {
    const pr = (ne as any)?.payload?.pull_request;
    const ref = pr?.head?.ref || (ne as any)?.payload?.ref;
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
  const p = fileOpt || ".a5c/events/";
  // Preserve URI forms like github:// and file:// — don't path.resolve them
  if (/^[a-zA-Z]+:\/\//.test(p)) return p;
  return path.resolve(p);
}

function loadYamlDocuments(filePath: string): any[] {
  const files: string[] = isDirectorySafe(filePath)
    ? walkYamlFiles(filePath)
    : [filePath];
  const out: any[] = [];
  for (const fp of files) {
    const raw = fs.readFileSync(fp, "utf8");
    const docs = YAML.parseAllDocuments(raw, { prettyErrors: false });
    for (const d of docs as any[]) {
      try {
        const obj = (d as any).toJSON();
        if (isReactorDoc(obj)) out.push(obj);
      } catch {}
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

function matchesAnyTrigger(
  onSpec: any,
  ne: ReturnType<typeof normalizeNE>,
): boolean {
  // onSpec can be a map of eventName -> filters; or a single eventName
  if (typeof onSpec === "string") return matchesTrigger(onSpec, undefined, ne);
  if (Array.isArray(onSpec)) {
    return onSpec.some((name) => matchesTrigger(String(name), undefined, ne));
  }
  if (onSpec && typeof onSpec === "object") {
    for (const [name, spec] of Object.entries(onSpec)) {
      if (matchesTrigger(String(name), spec, ne)) return true;
    }
  }
  return false;
}

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
  const eventType = ne.type || toStr(base.event) || undefined;

  // Custom event name: match against action/event_type
  const nameIsCustom = !KNOWN_GH_EVENTS.has(name) && name !== "any";
  if (nameIsCustom) {
    if (action !== name) return false;
  } else {
    if (name !== "any" && eventType && eventType !== name) return false;
  }

  if (!spec || typeof spec !== "object") return true;
  // types: sub-actions under GH event (e.g., pull_request: types: [opened])
  if (Array.isArray((spec as any).types) && KNOWN_GH_EVENTS.has(name)) {
    const set = new Set(((spec as any).types as any[]).map((v) => String(v)));
    if (!action || !set.has(action)) return false;
  }
  // events: repository_dispatch event types
  if (Array.isArray((spec as any).events)) {
    const set = new Set(((spec as any).events as any[]).map((v) => String(v)));
    if (!action || !set.has(action)) return false;
  }
  // labels: require all to be present; for custom events, read from client_payload.labels, else use NE labels
  if (Array.isArray((spec as any).labels)) {
    const needed = new Set((spec as any).labels.map((v: any) => String(v)));
    const labelsSource = nameIsCustom
      ? normalizeLabels((base as any)?.client_payload?.labels)
      : ne.labels;
    for (const l of Array.from(needed.values()) as string[])
      if (!labelsSource.includes(String(l))) return false;
  }
  // phase: check in payload.phase or client_payload.phase
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
  // filters: array of { expression: ${{ ... }} } – match if ANY expression is truthy
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
  "issue_comment",
  "workflow_run",
  "repository_dispatch",
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

function attachDocCommands(
  payload: any,
  doc: any,
  neCtx: ReturnType<typeof normalizeNE>,
): any {
  const out = { ...(payload || {}) } as any;
  // pre_set_labels first
  if (
    Array.isArray((doc as any).pre_set_labels) &&
    (doc as any).pre_set_labels.length
  ) {
    out.pre_set_labels = resolveTemplates((doc as any).pre_set_labels, neCtx);
  }
  // then script
  if (Array.isArray((doc as any).script) && (doc as any).script.length) {
    out.script = resolveTemplates((doc as any).script, neCtx);
  }
  // then set_labels
  if (
    Array.isArray((doc as any).set_labels) &&
    (doc as any).set_labels.length
  ) {
    out.set_labels = resolveTemplates((doc as any).set_labels, neCtx);
  }
  // propagate env (evaluated earlier into neCtx.enriched.derived.doc_env)
  const docEnv = (neCtx as any)?.enriched?.derived?.doc_env;
  if (docEnv && typeof docEnv === "object") {
    out.env = { ...docEnv };
  }
  return out;
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
        `return (${compiled});`,
      );
      return fn(eventArg, { ...ctx }, process.env, vars, secrets);
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
        `return (${compiled});`,
      );
      const v = fn(eventArg, { ...ctx }, process.env, vars, secrets);
      return v == null ? "" : String(v);
    } catch {
      return "";
    }
  });
}

function buildExpressionEvent(base: any): any {
  try {
    const e: any = base && typeof base === "object" ? { ...base } : {};
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
    const containsMatch = /^contains\((.+)\)$/.exec(t);
    if (containsMatch) {
      const arg = containsMatch[1].trim();
      expr = `(${expr}).includes(${arg})`;
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
      const parsed = parseGithubEntity(url);
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
    candidates.push(".a5c/events/reactor.yaml");
    return candidates;
  }
  if (isDir) {
    // If a directory path is provided, try directory itself (recursive) and '<dir>/reactor.yaml'
    candidates.push(rel);
    candidates.push(`${rel}/reactor.yaml`);
  } else {
    candidates.push(rel);
  }
  // Special-case common root path
  if (rel === ".a5c/events") {
    candidates.push(`.a5c/events/reactor.yaml`);
  }
  return Array.from(new Set(candidates));
}

function parseGithubEntity(
  url: string,
): { owner: string; repo: string; number?: number } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idxRepos = parts[0] === "repos" ? 1 : 0;
    const owner = parts[idxRepos];
    const repo = parts[idxRepos + 1];
    const numberStr = parts[idxRepos + 3];
    const number = Number.parseInt(numberStr, 10);
    if (!owner || !repo) return null;
    return {
      owner,
      repo,
      number: Number.isFinite(number) ? number : undefined,
    };
  } catch {
    return null;
  }
}

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
