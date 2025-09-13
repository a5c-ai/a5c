export type NormalizedEvent = {
  id: string
  provider: string
  type: string
  occurred_at: string
  repo?: Record<string, unknown>
  ref?: Record<string, unknown>
  actor?: Record<string, unknown>
  payload?: unknown
  enriched?: {
    metadata?: Record<string, unknown>
    derived?: Record<string, unknown>
    correlations?: Record<string, unknown>
  }
  labels?: string[]
  provenance?: Record<string, unknown>
  composed?: Array<Record<string, unknown>>
}

export type CLIOptions = {
  in?: string
  out?: string
  select?: string
  filter?: string
  label?: string[]
  source?: string
  rules?: string
  flag?: string[]
}

