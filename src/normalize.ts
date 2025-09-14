import type { NormalizedEvent } from './types.js'
import { normalizeCommand } from './commands/normalize.js'

// Backwards-compatible API used by tests and Node consumers
export async function handleNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent }>{
  return normalizeCommand(opts)
}
