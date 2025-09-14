import type { NormalizedEvent } from './types.js'
import { readJSONFile } from './config.js'
import { normalizeGithub } from './providers/github/normalize.js'
export async function handleNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent | Record<string, unknown> }>{
  const src = (opts.source || 'cli').toLowerCase()
  // For CLI source, --in is required
  if (src === 'cli' && !opts.in) {
    return { code: 2, output: { error: 'normalize: missing --in for source=cli' } }
  }
  try {
    const payload = readJSONFile<any>(opts.in)
    // For now only GitHub provider is supported.
    const output: NormalizedEvent = normalizeGithub(payload, { source: opts.source, labels: opts.labels })
    return { code: 0, output }
  } catch (e: any) {
    return { code: 2, output: { error: String(e?.message || e) } }
  }
}
