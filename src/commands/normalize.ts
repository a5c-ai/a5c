import type { NormalizedEvent } from '../types.js'
import { readJSONFile } from '../config.js'
import { mapToNE } from '../providers/github/map.js'

export async function normalizeCommand(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent }>{
  const payload = readJSONFile<any>(opts.in) || {}
  const output = mapToNE(payload, { source: opts.source, labels: opts.labels })
  return { code: 0, output }
}

