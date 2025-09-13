import { NormalizedEvent } from './types.js'
import { readJSONFile } from './config.js'

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean>
}): Promise<{ code: number; output: NormalizedEvent }>{
  const payload = readJSONFile<unknown>(opts.in)
  const now = new Date().toISOString()
  const output: NormalizedEvent = {
    id: 'temp-' + Math.random().toString(36).slice(2),
    provider: 'github',
    type: 'unknown',
    occurred_at: now,
    payload,
    labels: opts.labels || [],
    enriched: {
      metadata: { rules: opts.rules || null },
      derived: { flags: opts.flags || {} }
    }
  }
  return { code: 0, output }
}

