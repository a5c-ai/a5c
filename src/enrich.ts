import type { NormalizedEvent } from './types.js'
import { enrichCommand } from './commands/enrich.js'

// Backwards-compatible API used by tests and Node consumers
export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output: NormalizedEvent }>{
  return enrichCommand(opts)
}
