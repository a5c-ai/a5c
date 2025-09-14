import { redactObject } from '../../src/utils/redact.js'

// Stabilize dynamic fields for snapshot/golden comparisons
export function stable<T = any>(obj: T): T {
  const copy: any = redactObject(structuredClone(obj))
  // Replace timestamps and ids likely to change
  if (copy && typeof copy === 'object') {
    walk(copy)
  }
  return copy as T
}

function walk(o: any) {
  if (Array.isArray(o)) {
    for (const v of o) walk(v)
    return
  }
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) {
      const v = o[k]
      if (typeof v === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:.+Z$/.test(v)) o[k] = '<iso-8601>'
        else if (/^(temp-|[0-9a-f]{7,})/.test(v) && (k === 'id' || k.endsWith('_id') || k.endsWith('sha'))) o[k] = `<${k}>`
        else if (/^[0-9a-f]{40}$/.test(v)) o[k] = '<sha>'
      } else if (typeof v === 'number' && (k === 'run_id')) {
        o[k] = 0
      } else if (v && typeof v === 'object') {
        walk(v)
      }
    }
  }
}

