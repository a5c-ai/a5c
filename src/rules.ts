import fs from 'node:fs'
import path from 'node:path'

export type RuleCondition =
  | { path: string; equals?: any; in?: any[]; contains?: any }

export interface RuleSpec {
  key: string
  when?: { all?: RuleCondition[]; any?: RuleCondition[] }
  targets?: string[]
  labels?: string[]
  data?: Record<string, any>
}

export interface RuleMatch {
  key: string
  targets?: string[]
  labels?: string[]
  data?: Record<string, any>
}

export function loadRules(file?: string): RuleSpec[] {
  if (!file) return []
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) return []
  const raw = fs.readFileSync(p, 'utf8')
  const isJSON = /\.json$/i.test(p)
  if (isJSON) {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  }
  // Minimal YAML loader for simple lists and key: value (no anchors, etc.).
  // For MVP we support JSON superset via try/catch, else a naive YAML using `---` and `-` list parsing.
  try {
    // Attempt JSON first in case YAML is actually JSON
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {}
  // Very small YAML subset: either an array of items beginning with '- ' or a single map of simple scalars/arrays
  const lines = raw.split(/\r?\n/)
  const items: any[] = []
  let current: any = null
  for (let line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    if (t.startsWith('- ')) {
      if (current) items.push(current)
      current = {}
      line = t.slice(2)
      if (line.includes(':')) {
        const [k, v] = splitKeyVal(line)
        if (k) current[k] = parseScalar(v)
      }
    } else if (current) {
      if (/^\w[\w_-]*:\s*/.test(t)) {
        const [k, v] = splitKeyVal(t)
        if (k) current[k] = parseScalar(v)
      }
    }
  }
  if (current) items.push(current)
  return items as RuleSpec[]
}

function splitKeyVal(s: string): [string, string] {
  const idx = s.indexOf(':')
  if (idx === -1) return [s.trim(), '']
  return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()]
}

function parseScalar(v: string): any {
  if (!v) return null
  // strip quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  // booleans
  const low = v.toLowerCase()
  if (low === 'true') return true
  if (low === 'false') return false
  // number
  const n = Number(v)
  if (String(n) === v || String(n) === low) return n
  // arrays like [a,b]
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(',').map((s) => parseScalar(s.trim()))
  }
  return v
}

export function evaluateRules(obj: any, rules: RuleSpec[]): RuleMatch[] {
  const matches: RuleMatch[] = []
  for (const r of rules || []) {
    const ok = evaluateWhen(obj, r.when)
    if (ok) matches.push({ key: r.key, targets: r.targets, labels: r.labels, data: r.data })
  }
  return matches
}

function evaluateWhen(obj: any, when?: RuleSpec['when']): boolean {
  if (!when || (!when.all && !when.any)) return true
  if (when.all) return when.all.every((c) => evalCond(obj, c))
  if (when.any) return when.any.some((c) => evalCond(obj, c))
  return true
}

function evalCond(obj: any, c: RuleCondition): boolean {
  const val = getByPath(obj, c.path)
  if ('equals' in c) return deepEquals(val, (c as any).equals)
  if ('in' in c) return Array.isArray((c as any).in) && (c as any).in.includes(val)
  if ('contains' in c) {
    const needle = (c as any).contains
    if (Array.isArray(val)) return val.includes(needle)
    if (typeof val === 'string') return val.includes(String(needle))
    return false
  }
  return false
}

function getByPath(obj: any, p: string): any {
  if (!p) return undefined
  // Support prefixes like '$.' or plain path; split by '.' and support basic [*] for arrays flattened
  let pathStr = p.replace(/^\$\.?/, '')
  const parts = pathStr.split('.')
  let cur: any = obj
  for (let part of parts) {
    if (cur == null) return undefined
    const m = part.match(/^(\w[\w_-]*)(\[(\*|\d+)\])?$/)
    if (!m) {
      cur = cur[part as any]
      continue
    }
    const key = m[1]
    const idx = m[3]
    cur = cur[key]
    if (idx != null) {
      if (!Array.isArray(cur)) return undefined
      if (idx === '*') {
        // flatten array for next step by returning the array itself
        // caller functions that need aggregation should post-process
        return cur.map((x) => x)
      } else {
        const n = Number(idx)
        cur = cur[n]
      }
    }
  }
  // If contains is used and the path returns an array of objects, allow contains to work on projecting .name
  return cur
}

function deepEquals(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

