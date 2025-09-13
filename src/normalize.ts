import { NormalizedEvent } from './types.js'
import { readJSONFile } from './config.js'

export async function handleNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
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
    provenance: { source: opts.source || 'cli' }
  }
  return { code: 0, output }
}

