import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { readJSONFile } from "./config.js";

export interface ReactorOptions {
  in?: string;
  out?: string;
  file?: string;
  branch?: string;
}

export interface ReactorOutputEvent {
  event_type: string;
  client_payload: any;
}

export async function handleReactor(opts: ReactorOptions): Promise<{
  code: number;
  output?: { events: ReactorOutputEvent[] };
  errorMessage?: string;
}> {
  try {
    const inputObj = readInput(opts.in);
    const ne = normalizeNE(inputObj);
    const rulesPath = resolveRulesPath(opts.file);
    let docs = loadYamlDocuments(rulesPath);
    if (!docs.length) {
      const remote = await tryLoadRemoteYaml(
        ne,
        rulesPath,
        opts.branch || process.env.A5C_EVENT_CONFIG_BRANCH || "main",
      );
      if (remote && remote.length) docs = remote;
    }
    const events: ReactorOutputEvent[] = [];
    for (const doc of docs) {
      if (!doc || typeof doc !== "object") continue;
      const onSpec: any = (doc as any).on;
      const emitSpec: any = (doc as any).emit;
      if (!onSpec || !emitSpec) continue;
      const matched = matchesAnyTrigger(onSpec, ne);
      if (!matched) continue;
      // Build events from emit map
      if (emitSpec && typeof emitSpec === "object") {
        for (const [eventType, spec] of Object.entries(emitSpec)) {
          const payload = buildClientPayload(spec, ne);
          const merged = attachDocCommands(payload, doc, ne);
          events.push({ event_type: eventType, client_payload: merged });
        }
      }
    }
    return { code: 0, output: { events } };
  } catch (e: any) {
    const msg = String(e?.message || e);
    return { code: 1, errorMessage: `reactor: ${msg}` };
  }
}

function readInput(inPath?: string): any {
  if (inPath) return readJSONFile(inPath);
  const raw = fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function resolveRulesPath(fileOpt?: string): string {
  const p = fileOpt || ".a5c/events/";
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
        if (obj && typeof obj === "object") out.push(obj);
      } catch {}
    }
  }
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
  if (Array.isArray(doc?.set_labels) && doc.set_labels.length) {
    out.set_labels = resolveTemplates(doc.set_labels, neCtx);
  }
  if (Array.isArray(doc?.script) && doc.script.length) {
    out.script = resolveTemplates(doc.script, neCtx);
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
  const m = TMPL_RE.exec(s);
  if (!m) return s;
  const expr = m[1];
  try {
    // Provide a minimal sandbox with event (=payload), ne (=full object), env
    const compiled = preprocessExpression(expr);
    const fn = new Function("event", "ne", "env", `return (${compiled});`);
    return fn(ctx.payload, { ...ctx }, process.env);
  } catch {
    return null;
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

async function tryLoadRemoteYaml(
  ne: ReturnType<typeof normalizeNE>,
  localPath: string,
  branch: string,
): Promise<any[]> {
  try {
    const token =
      process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) return [];
    const repoInfo = inferRepoFromNE(ne);
    if (!repoInfo) return [];
    const { owner, repo } = repoInfo;
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: token });
    const paths = computeRemotePaths(localPath);
    const docs: any[] = [];
    for (const p of paths) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: p,
          ref: branch,
        });
        if (Array.isArray(data)) continue;
        const encoding = (data as any).encoding || "base64";
        const content: string = Buffer.from(
          (data as any).content || "",
          encoding,
        ).toString("utf8");
        const parsed = YAML.parseAllDocuments(content, { prettyErrors: false });
        for (const d of parsed as any[]) {
          try {
            const obj = (d as any).toJSON();
            if (obj && typeof obj === "object") docs.push(obj);
          } catch {}
        }
      } catch {}
    }
    return docs;
  } catch {
    return [];
  }
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
  const rel = localPath.replace(/^[A-Za-z]:\\|^\/+/, "").replace(/\\/g, "/");
  const candidates: string[] = [];
  if (rel.endsWith("/")) {
    candidates.push(`${rel}.a5c/events/reactor.yaml`);
    candidates.push(`${rel}.a5c/events/`);
  } else {
    candidates.push(rel);
  }
  // Add defaults if the caller passed just a directory like ".a5c/events/"
  if (
    rel === ".a5c/events/" ||
    rel.endsWith("/.a5c/events/") ||
    rel === ".a5c/events"
  ) {
    candidates.push(".a5c/events/reactor.yaml");
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
