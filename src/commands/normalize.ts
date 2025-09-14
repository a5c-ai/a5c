import type { NormalizedEvent } from '../types.js'
import { githubProvider } from '../providers/github/index.js'
import { readJSONFile } from '../config.js'

// Command-layer wrapper to keep CLI thin and user-friendly
export async function cmdNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }>{
  // Resolve input path
  let inPath = opts.in
  if (!inPath && String(opts.source) === 'actions') {
    inPath = process.env.GITHUB_EVENT_PATH
    if (!inPath) return { code: 2, errorMessage: 'GITHUB_EVENT_PATH is not set; provide --in FILE' }
  }
  if (!inPath) return { code: 2, errorMessage: 'Missing required --in FILE (or use --source actions)' }

  try {
    const payload = readJSONFile<any>(inPath) || {}
    const output = githubProvider.normalize(payload, { source: opts.source, labels: opts.labels })
    return { code: 0, output }
  } catch (e: any) {
    const msg = e?.code === 'ENOENT' ? `Input file not found: ${e?.path || inPath}` : `Invalid JSON or read error: ${e?.message || e}`
    return { code: 2, errorMessage: msg }
  }
}

// Programmatic API used by src/normalize.ts compatibility re-export
export async function runNormalize(opts: { in?: string; source?: string; labels?: string[] }): Promise<{ code: number; output: NormalizedEvent }>{
  if (!opts.in) {
    return { code: 2, output: { id: 'error', provider: 'github', type: 'error', occurred_at: new Date().toISOString(), payload: {}, labels: opts.labels, provenance: { source: opts.source }, error: 'missing --in', enriched: { metadata: { error: 'missing --in' } } } as any }
  }
  try {
    const payload = readJSONFile<any>(opts.in) || {}
    const output = githubProvider.normalize(payload, { source: opts.source, labels: opts.labels })
    return { code: 0, output }
  } catch (e: any) {
    const msg = String(e?.message || e)
    return { code: 2, output: { id: 'error', provider: 'github', type: 'error', occurred_at: new Date().toISOString(), payload: {}, labels: opts.labels, provenance: { source: opts.source }, error: msg, enriched: { metadata: { error: msg } } } as any }
  }
}

// Backward/CLI adapter name expected by src/cli.ts
// Note: keep runNormalize for programmatic usage via src/normalize.ts.
// Do not re-export it as cmdNormalize to avoid duplicate identifier.
// Do not alias cmdNormalize here to avoid TS2300 duplicate identifier errors
