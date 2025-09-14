import type { NormalizedEvent } from '../types.js'

export type NormalizeOptions = { source?: string; labels?: string[] }
export type EnrichOptions = { token?: string; commitLimit?: number; fileLimit?: number; octokit?: any }

export interface Provider {
  normalize(payload: any, opts?: NormalizeOptions): NormalizedEvent
  enrich(event: any, opts?: EnrichOptions): Promise<any>
}

