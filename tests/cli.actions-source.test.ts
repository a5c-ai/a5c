import { describe, it, expect } from 'vitest'
import { resolveNormalizeInput } from '../src/cli-helpers.js'

describe('CLI --source actions input resolution', () => {
  it('returns explicit --in when provided', () => {
    const env = { ...process.env }
    const val = resolveNormalizeInput('foo.json', 'actions', env)
    expect(val).toBe('foo.json')
  })

  it('uses GITHUB_EVENT_PATH when --in is missing and source=actions', () => {
    const env = { ...process.env, GITHUB_EVENT_PATH: '/path/to/event.json' }
    const val = resolveNormalizeInput(undefined, 'actions', env)
    expect(val).toBe('/path/to/event.json')
  })

  it('throws friendly error when GITHUB_EVENT_PATH missing', () => {
    const env = { ...process.env }
    delete (env as any).GITHUB_EVENT_PATH
    expect(() => resolveNormalizeInput(undefined, 'actions', env)).toThrow(/GITHUB_EVENT_PATH is not set/)
  })
})

