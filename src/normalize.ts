import type { NormalizedEvent } from './types.js'
import { readJSONFile } from './config.js'
import { normalizeGithub } from './providers/github/normalize.js'

// Backwards-compatible API used by tests and Node consumers
export async function handleNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent }>{
  const payload = readJSONFile<any>(opts.in)
  // For now only GitHub provider is supported.
  const output: NormalizedEvent = normalizeGithub(payload, { source: opts.source, labels: opts.labels })
  return { code: 0, output }
}
