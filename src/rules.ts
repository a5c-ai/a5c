import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

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
  // Try JSON first
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    // fall through to YAML parsing
  }
  // YAML fallback
  const y = YAML.parse(raw)
  return Array.isArray(y) ? (y as RuleSpec[]) : [y as RuleSpec]
}

// removed naive YAML helpers; using 'yaml' package for reliability

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
    if (Array.isArray(val)) {
      // allow arrays of primitives or objects (check common 'name' prop)
      return val.some((it) => {
        if (it == null) return false
        if (typeof it === 'string' || typeof it === 'number' || typeof it === 'boolean') return String(it) === String(needle)
        if (typeof it === 'object' && 'name' in it) return String((it as any).name) === String(needle)
        return false
      })
    }
    if (typeof val === 'string') return val.includes(String(needle))
    return false
  }
  return false
}

function getByPath(obj: any, p: string): any {
  if (!p) return undefined
  // Support prefixes like '$.' or plain path; split by '.' and support basic [*] for arrays flattened
  const pathStr = p.replace(/^\$\.?/, '')
  const parts = pathStr.split('.')
  let cur: any = obj
  for (const part of parts) {
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
