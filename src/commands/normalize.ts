import type { NormalizedEvent } from '../types.js'
import { readJSONFile } from '../config.js'
import { mapToNE } from '../providers/github/map.js'

// Command-layer wrapper to keep CLI thin
export async function cmdNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent }>{
  const payload = readJSONFile<any>(opts.in) || {}
  const output = mapToNE(payload, { source: opts.source, labels: opts.labels })
  return { code: 0, output }
}
export default cmdNormalize
