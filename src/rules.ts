import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
// Defer YAML import via createRequire for ESM compatibility
let yamlParse: ((s: string) => any) | undefined
try {
  const req = createRequire(import.meta.url)
  const y = req('yaml')
  yamlParse = y.parse || y.load
} catch {
  yamlParse = undefined
}

// Spec/YAML style rule
export type Rule = {
  name?: string
  on?: string | string[]
  when?: Expr
  emit: {
    key: string
    labels?: string[]
    targets?: string[]
    payload?: Record<string, unknown>
  }
}

// JSON simple rule (used by tests)
export type JsonRule = {
  key: string
  when?: JsonWhen
  labels?: string[]
  targets?: string[]
  payload?: Record<string, unknown>
}

export type RuleFile = Rule | JsonRule | { rules: (Rule | JsonRule)[] }

export type JsonWhen = { all?: JsonCond[]; any?: JsonCond[] } | JsonCond
export type JsonCond = { path: string; equals?: unknown; in?: unknown[]; contains?: unknown; exists?: boolean }

export type Expr = { all?: Expr[]; any?: Expr[]; not?: Expr } | { eq: [Path, unknown] } | { contains: [Path, unknown] } | { exists: Path }
export type Path = string // supports '$.' or plain with wildcards like labels[*].name

export type ComposedEvent = {
  type: 'composed'
  key: string
  source_event_id?: string
  labels?: string[]
  targets?: string[]
  payload?: Record<string, unknown>
}

export function loadRules(filePath?: string): (Rule | JsonRule)[] {
  if (!filePath) return []
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) return []
  const raw = fs.readFileSync(abs, 'utf8')
  const ext = path.extname(abs).toLowerCase()
  let data: any
  if (ext === '.yaml' || ext === '.yml') {
    try {
      if (!yamlParse) {
        // Minimal YAML fallback: support a tiny subset (keys, arrays, strings) for our test fixtures
        data = parseMiniYaml(raw)
      } else {
        data = yamlParse(raw)
      }
    } catch (e) {
      throw new Error(`Failed to parse YAML rules: ${String((e as any)?.message || e)}`)
    }
  } else {
    try {
      data = JSON.parse(raw)
    } catch (e) {
      throw new Error(`Failed to parse JSON rules: ${String((e as any)?.message || e)}`)
    }
  }
  if (!data) return []
  if (Array.isArray(data)) return data as (Rule | JsonRule)[]
  if (data.rules && Array.isArray(data.rules)) return data.rules as (Rule | JsonRule)[]
  return [data as Rule | JsonRule]
}

// no-op

type NormalizedRule = { key: string; on?: string[]; when?: Expr; labels?: string[]; targets?: string[]; payload?: Record<string, unknown> }

function normalizeRule(r: Rule | JsonRule): NormalizedRule {
  if ((r as Rule).emit) {
    const s = r as Rule
    return {
      key: s.emit.key,
      on: s.on ? (Array.isArray(s.on) ? s.on : [s.on]) : undefined,
      when: s.when,
      labels: s.emit.labels,
      targets: s.emit.targets,
      payload: s.emit.payload,
    }
  }
  const j = r as JsonRule
  return {
    key: j.key,
    when: j.when ? jsonWhenToExpr(j.when) : undefined,
    labels: j.labels,
    targets: j.targets,
    payload: j.payload,
  }
}

function jsonWhenToExpr(w: JsonWhen): Expr {
  if ((w as any).all || (w as any).any) {
    const g = w as any
    if (g.all) return { all: g.all.map(jsonCondToExpr) as any }
    if (g.any) return { any: g.any.map(jsonCondToExpr) as any }
  }
  return jsonCondToExpr(w as JsonCond)
}

function jsonCondToExpr(c: JsonCond): Expr {
  const p = c.path?.startsWith('$.') ? c.path : `$.${c.path}`
  if (Object.prototype.hasOwnProperty.call(c, 'equals')) return { eq: [p, (c as any).equals] }
  if (Object.prototype.hasOwnProperty.call(c, 'in')) return { contains: [p, (c as any).in] } as any
  if (Object.prototype.hasOwnProperty.call(c, 'contains')) return { contains: [p, (c as any).contains] }
  if (c.exists) return { exists: p }
  return { exists: p }
}

export function evaluateRulesDetailed(event: any, rules: (Rule | JsonRule)[]): { composed: ComposedEvent[]; status: any } {
  const composed: ComposedEvent[] = []
  const status = { ok: true, evaluated: 0, matched: 0, warnings: [] as string[] }
  for (const r of rules || []) {
    status.evaluated++
    const norm = normalizeRule(r)
    if (!norm.key) {
      status.warnings.push('rule missing key')
      continue
    }
    if (norm.on && event?.type && !norm.on.includes(event.type)) continue
    const ok = norm.when ? evalExpr(event, norm.when) : true
    if (!ok) continue
    status.matched++
    const ce: ComposedEvent = {
      type: 'composed',
      key: norm.key,
      source_event_id: event?.id,
      labels: norm.labels || [],
      targets: norm.targets || [],
      payload: norm.payload ? projectPayload(event, norm.payload) : undefined,
    }
    composed.push(ce)
  }
  return { composed, status }
}

export function evaluateRules(event: any, rules: (Rule | JsonRule)[]): ComposedEvent[] {
  return evaluateRulesDetailed(event, rules).composed
}

function evalExpr(ctx: any, expr: any): boolean {
  if (!expr || typeof expr !== 'object') return false
  if ('all' in expr) return (expr.all || []).every((e: any) => evalExpr(ctx, e))
  if ('any' in expr) return (expr.any || []).some((e: any) => evalExpr(ctx, e))
  if ('not' in expr) return !evalExpr(ctx, expr.not as Expr)
  // Support condensed condition objects like { path, eq|contains|in|exists }
  if ('path' in expr) {
    const p = String(expr.path)
    const got = getPath(ctx, p)
    if (Object.prototype.hasOwnProperty.call(expr, 'eq')) {
      return deepEqual(got, (expr as any).eq)
    }
    if (Object.prototype.hasOwnProperty.call(expr, 'contains')) {
      const val = (expr as any).contains
      if (Array.isArray(got)) return got.some((x) => deepEqual(x, val))
      if (typeof got === 'string') return String(got).includes(String(val))
      return false
    }
    if (Object.prototype.hasOwnProperty.call(expr, 'in')) {
      const arr = (expr as any).in as any[]
      if (!Array.isArray(arr)) return false
      return arr.some((v) => deepEqual(got, v))
    }
    if (Object.prototype.hasOwnProperty.call(expr, 'exists')) {
      return got !== undefined && got !== null
    }
  }
  if ('eq' in expr) {
    const [p, val] = expr.eq
    const got = getPath(ctx, p)
    return deepEqual(got, val)
  }
  if ('contains' in expr) {
    const [p, val] = expr.contains
    const got = getPath(ctx, p)
    if (Array.isArray(val)) {
      const arr = Array.isArray(got) ? got : [got]
      return arr.some((x) => (val as any[]).some((v) => deepEqual(x, v)))
    }
    if (Array.isArray(got)) return got.some((x) => deepEqual(x, val))
    if (typeof got === 'string') return String(got).includes(String(val))
    return false
  }
  if ('exists' in expr) {
    const got = getPath(ctx, expr.exists)
    return got !== undefined && got !== null
  }
  return false
}

function getPath(obj: any, pathStr: string): any {
  if (!pathStr) return undefined
  const pstr = pathStr.startsWith('$.') ? pathStr.slice(2) : pathStr
  const tokens = tokenizePath(pstr)
  return resolveTokens(obj, tokens)
}

function tokenizePath(p: string): (string | { wildcard: true })[] {
  const tokens: (string | { wildcard: true })[] = []
  let i = 0
  let cur = ''
  while (i < p.length) {
    const ch = p[i]
    if (ch === '.') {
      if (cur) {
        tokens.push(cur)
        cur = ''
      }
      i++
      continue
    }
    if (ch === '[') {
      if (cur) {
        tokens.push(cur)
        cur = ''
      }
      const end = p.indexOf(']', i)
      const inside = p.slice(i + 1, end).trim()
      if (inside === '*') tokens.push({ wildcard: true })
      else tokens.push(inside)
      i = end + 1
      continue
    }
    cur += ch
    i++
  }
  if (cur) tokens.push(cur)
  return tokens
}

function resolveTokens(obj: any, tokens: (string | { wildcard: true })[]): any {
  let nodes: any[] = [obj]
  for (const t of tokens) {
    const next: any[] = []
    if (typeof t === 'string') {
      for (const n of nodes) {
        if (Array.isArray(n)) {
          const idx = Number(t)
          if (Number.isInteger(idx) && n[idx] !== undefined) next.push(n[idx])
        } else if (n && typeof n === 'object') {
          if ((n as any)[t] !== undefined) next.push((n as any)[t])
        }
      }
    } else {
      for (const n of nodes) {
        if (Array.isArray(n)) next.push(...n)
        else if (n && typeof n === 'object') next.push(...Object.values(n))
      }
    }
    nodes = next
    if (!nodes.length) return undefined
  }
  if (nodes.length === 1) return nodes[0]
  return nodes
}

function projectPayload(src: any, shape: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(shape)) {
    if (typeof v === 'string') out[k] = getPath(src, v)
    else out[k] = v
  }
  return out
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
    return true
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length) return false
    for (const k of ak) if (!deepEqual((a as any)[k], (b as any)[k])) return false
    return true
  }
  return false
}

// Extremely small YAML subset parser used only if 'yaml' module is unavailable.
// Supports:
// rules:
//   - name: x
//     on: pull_request
//     when:
//       all:
//         - eq: ["$.path", "value"]
//     emit:
//       key: something
function parseMiniYaml(src: string): any {
  // Very naive implementation: convert indentation-based YAML to JSON via simple heuristics
  // This is solely to satisfy offline tests with our known fixture.
  // For general use, install 'yaml' dependency.
  const lines = src.split(/\r?\n/)
  const stack: any[] = [{}]
  const indents: number[] = [0]
  let current = stack[0]

  function setValue(key: string, value: any) {
    if (Array.isArray(current)) current.push(value)
    else current[key] = value
  }

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '')
    if (!line.trim()) continue
    const indent = line.match(/^\s*/)?.[0].length || 0
    while (indent < indents[indents.length - 1]) {
      indents.pop(); stack.pop(); current = stack[stack.length - 1]
    }
    const kv = line.trim()
    if (kv.startsWith('- ')) {
      const entry = kv.slice(2)
      if (!Array.isArray(current)) {
        // create array under previous key
        const arr: any[] = []
        // assign to the last object key if exists
        // find parent object and last key
        const parent = stack[stack.length - 1]
        const keys = Object.keys(parent)
        const lastKey = keys[keys.length - 1]
        parent[lastKey] = arr
        current = arr
        stack.push(current)
        indents.push(indent)
      }
      if (entry.includes(':')) {
        const [k, v] = entry.split(/:\s*/, 2)
        const obj: any = {}
        obj[k] = parseScalar(v)
        current.push(obj)
        // descend if next lines indented will add more keys
        current = obj
        stack.push(current)
        indents.push(indent + 2)
      } else {
        current.push(parseScalar(entry))
      }
      continue
    }
    const m = kv.match(/([^:]+):\s*(.*)$/)
    if (m) {
      const key = m[1].trim()
      const value = m[2]
      if (value === '') {
        const obj: any = {}
        setValue(key, obj)
        current = obj
        stack.push(current)
        indents.push(indent + 2)
      } else {
        setValue(key, parseScalar(value))
      }
    }
  }
  return stack[0]
}

function parseScalar(v: string): any {
  const s = v.trim()
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === 'null') return null
  if (s.startsWith('[') && s.endsWith(']')) {
    try { return JSON.parse(s) } catch { return s }
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}
