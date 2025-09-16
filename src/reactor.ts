import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { readJSONFile } from "./config.js";

export interface ReactorOptions {
  in?: string;
  out?: string;
  file?: string;
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
    const docs = loadYamlDocuments(rulesPath);
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
          events.push({ event_type: eventType, client_payload: payload });
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
  const p = fileOpt || ".a5c/events/reactor.yaml";
  return path.resolve(p);
}

function loadYamlDocuments(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const docs = YAML.parseAllDocuments(raw, { prettyErrors: false });
  return docs
    .map((d: any) => {
      try {
        return (d as any).toJSON();
      } catch {
        return undefined;
      }
    })
    .filter((d: any) => d && typeof d === "object") as any[];
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
  const nameIsCustom = !KNOWN_GH_EVENTS.has(name);
  if (nameIsCustom) {
    if (action !== name) return false;
  } else {
    if (eventType && eventType !== name) return false;
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
    const fn = new Function("event", "ne", "env", `return (${expr});`);
    return fn(ctx.payload, { ...ctx }, process.env);
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
