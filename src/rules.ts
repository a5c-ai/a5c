import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type Json = any;

export type RuleFile = { rules?: Rule[] } | Rule[];

export interface Rule {
  name?: string;
  on?: string | string[];
  when?: { all?: Cond[]; any?: Cond[] } | Cond[];
  emit?: {
    key: string;
    labels?: string[];
    targets?: string[];
    payload?: Record<string, string>;
  };
}

type Cond =
  | { eq: [string, any] }
  | { ne: [string, any] }
  | { in: [string, any[]] }
  | { contains: [string, any] }
  | { path: string; in?: any[]; contains?: any; eq?: any; ne?: any };

export type RulesEvalResult = {
  composed: {
    key: string;
    targets?: string[];
    criteria?: string[];
    labels?: string[];
    payload?: Record<string, any>;
  }[];
  status: { ok: boolean; warnings?: string[]; errors?: string[] };
};

export function loadRules(file?: string): Rule[] {
  if (!file) return [];
  const abs = path.resolve(file);
  const text = fs.readFileSync(abs, "utf8");
  const isYaml = /\.ya?ml$/i.test(file);
  if (isYaml) {
    const data = YAML.parse(text) as RuleFile;
    return normalizeRuleFile(data);
  }
  const data = JSON.parse(text) as RuleFile;
  return normalizeRuleFile(data);
}

function normalizeRuleFile(data: RuleFile): Rule[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.rules)
      ? (data as any).rules
      : [];
  const out: Rule[] = [];
  for (const r of arr) {
    if (!r) continue;
    if ((r as any).emit) {
      out.push(r as Rule);
      continue;
    }
    // Support simplified JSON form used in tests: { key, when, targets, labels, payload, on }
    const simple: any = r;
    if (simple.key || simple.targets || simple.labels || simple.payload) {
      out.push({
        name: simple.name,
        on: simple.on,
        when: simple.when,
        emit: {
          key: simple.key,
          targets: simple.targets,
          labels: simple.labels,
          payload: simple.payload,
        },
      });
      continue;
    }
  }
  return out;
}

export function evaluateRulesDetailed(
  ne: Json,
  rules: Rule[],
): RulesEvalResult {
  const out: RulesEvalResult = {
    composed: [],
    status: { ok: true, warnings: [] },
  };
  for (const r of rules) {
    try {
      if (!r?.emit?.key) continue;
      if (!matchOn(ne, r.on)) continue;
      const res = evalWhen(ne, r.when);
      if (res.matched) {
        out.composed.push({
          key: r.emit!.key,
          targets: r.emit?.targets,
          labels: r.emit?.labels,
          criteria: res.criteria,
          payload: projectPayload(ne, r.emit?.payload || {}),
        });
      }
    } catch (e: any) {
      out.status.ok = false;
      out.status.warnings!.push(String(e?.message || e));
    }
  }
  return out;
}

// Compatibility adapter used by src/enrich.ts
export function evaluateRules(
  ne: Json,
  rules: Rule[],
): Array<{ key: string; targets?: string[]; labels?: string[]; data?: any }> {
  const res = evaluateRulesDetailed(ne, rules);
  return res.composed.map((c) => ({
    key: c.key,
    targets: c.targets,
    labels: c.labels,
    data: c.payload,
  }));
}

function matchOn(ne: Json, on?: string | string[]): boolean {
  if (!on) return true;
  const types = Array.isArray(on) ? on : [on];
  return types.includes(ne.type);
}

function evalWhen(
  ne: Json,
  when?: { all?: Cond[]; any?: Cond[] } | Cond[],
): { matched: boolean; criteria: string[] } {
  if (!when) return { matched: true, criteria: [] };
  if (Array.isArray(when)) return evalAll(ne, when);
  if (when.all) return evalAll(ne, when.all);
  if (when.any) return evalAny(ne, when.any);
  return { matched: true, criteria: [] };
}

function evalAll(
  ne: Json,
  conds: Cond[],
): { matched: boolean; criteria: string[] } {
  const criteria: string[] = [];
  for (const c of conds) {
    const { ok, desc } = evalCond(ne, c);
    if (!ok) return { matched: false, criteria };
    if (desc) criteria.push(desc);
  }
  return { matched: true, criteria };
}

function evalAny(
  ne: Json,
  conds: Cond[],
): { matched: boolean; criteria: string[] } {
  const criteria: string[] = [];
  for (const c of conds) {
    const { ok, desc } = evalCond(ne, c);
    if (ok) {
      if (desc) criteria.push(desc);
      return { matched: true, criteria };
    }
  }
  return { matched: false, criteria };
}

function evalCond(ne: Json, c: Cond): { ok: boolean; desc?: string } {
  // Support flat style: { path, in|contains|eq|ne }
  if ((c as any).path) {
    const cc: any = c;
    const p = String(cc.path);
    if (Array.isArray(cc.in)) {
      const got = getPath(ne, p);
      const ok = cc.in.some((v: any) => deepEqual(got, v));
      return { ok, desc: ok ? `${p} in ${toDbg(cc.in)}` : undefined };
    }
    if ("contains" in cc) {
      const got = getPath(ne, p);
      const ok = containsValue(got, cc.contains);
      return {
        ok,
        desc: ok ? `contains(${p}, ${toDbg(cc.contains)})` : undefined,
      };
    }
    if ("eq" in cc) {
      const got = getPath(ne, p);
      const ok = deepEqual(got, cc.eq);
      return { ok, desc: ok ? `${p} == ${toDbg(cc.eq)}` : undefined };
    }
    if ("ne" in cc) {
      const got = getPath(ne, p);
      const ok = !deepEqual(got, cc.ne);
      return { ok, desc: ok ? `${p} != ${toDbg(cc.ne)}` : undefined };
    }
  }
  if ("eq" in c) {
    const [p, v] = c.eq;
    const got = getPath(ne, p);
    const ok = deepEqual(got, v);
    return { ok, desc: ok ? `${p} == ${toDbg(v)}` : undefined };
  }
  if ("ne" in c) {
    const [p, v] = c.ne;
    const got = getPath(ne, p);
    const ok = !deepEqual(got, v);
    return { ok, desc: ok ? `${p} != ${toDbg(v)}` : undefined };
  }
  if ("in" in c) {
    const [p, arr] = (c as any).in as [string, any[]];
    const got = getPath(ne, p);
    const ok = Array.isArray(arr) && arr.some((v) => deepEqual(got, v));
    return { ok, desc: ok ? `${p} in ${toDbg(arr)}` : undefined };
  }
  if ("contains" in c) {
    const [p, v] = c.contains;
    const got = getPath(ne, p);
    const ok = containsValue(got, v);
    return { ok, desc: ok ? `contains(${p}, ${toDbg(v)})` : undefined };
  }
  return { ok: false };
}

function getPath(obj: Json, expr: string): any {
  // Supports JSONPath-lite: $.a.b, $.a[*].b, $.a[0].b
  const m = String(expr).trim();
  const s = m.startsWith("$.")
    ? m.slice(2)
    : m.startsWith("$")
      ? m.slice(1)
      : m;
  const parts = s.split(".");
  let cur: any = obj;
  for (const raw of parts) {
    const segs: { key: string; idx?: number; star?: boolean }[] = [];
    let rem = raw;
    const keyMatch = /^([^\[]+)/.exec(rem);
    const baseKey = keyMatch ? keyMatch[1] : rem;
    segs.push({ key: baseKey });
    rem = rem.slice(baseKey.length);
    while (rem.startsWith("[")) {
      const m2 = /^\[(\*|\d+)\]/.exec(rem);
      if (!m2) break;
      if (m2[1] === "*") segs.push({ key: "", star: true });
      else segs.push({ key: "", idx: Number(m2[1]) });
      rem = rem.slice(m2[0].length);
    }

    // Step into base key
    cur = Array.isArray(cur) ? cur.map((x) => x?.[baseKey]) : cur?.[baseKey];
    // Apply brackets
    for (let i = 1; i < segs.length; i++) {
      const s = segs[i];
      if (s.star) {
        // ensure array
        if (!Array.isArray(cur)) cur = cur == null ? [] : [cur];
        // no-op: keep as array for next property
      } else if (typeof s.idx === "number") {
        if (Array.isArray(cur))
          cur = cur.map((x) => (Array.isArray(x) ? x[s.idx!] : x?.[s.idx!]));
        else cur = Array.isArray(cur) ? cur[s.idx] : undefined;
      }
    }
    // Flatten one level if array of arrays
    if (Array.isArray(cur) && cur.some(Array.isArray)) cur = cur.flat();
  }
  // If unresolved and known alias from enriched.github.pr.* → payload.pull_request.*
  if (cur === undefined) {
    const e = String(expr);
    const alias = e.replace(
      /^(?:\$\.)?enriched\.github\.pr\./,
      "$.payload.pull_request.",
    );
    if (alias !== e) return getPath(obj, alias);
  }
  return cur;
}

function containsValue(container: any, v: any): boolean {
  if (Array.isArray(container))
    return container.some((x) => containsValue(x, v));
  if (container && typeof container === "object")
    return Object.values(container).some((x) => containsValue(x, v));
  return container === v;
}

function projectPayload(
  ne: Json,
  spec: Record<string, string>,
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, expr] of Object.entries(spec)) out[k] = getPath(ne, expr);
  return out;
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function toDbg(v: any): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// No-op helper retained for backward compatibility
