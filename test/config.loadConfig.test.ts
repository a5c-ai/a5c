import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../src/config.js'

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const prev = { ...process.env }
  try {
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete (process.env as any)[k]
      else (process.env as any)[k] = v
    }
    fn()
  } finally {
    process.env = prev as any
  }
}

describe('loadConfig token precedence', () => {
  beforeEach(() => {
    // ensure a clean slate for the two variables under test
    delete (process.env as any).A5C_AGENT_GITHUB_TOKEN
    delete (process.env as any).GITHUB_TOKEN
  })
  afterEach(() => {
    delete (process.env as any).A5C_AGENT_GITHUB_TOKEN
    delete (process.env as any).GITHUB_TOKEN
  })

  it('returns undefined when neither token is set', () => {
    const cfg = loadConfig()
    expect(cfg.githubToken).toBeUndefined()
  })

  it('uses GITHUB_TOKEN when only it is set', () => {
    withEnv({ GITHUB_TOKEN: 'ghp_only_123' }, () => {
      const cfg = loadConfig()
      expect(cfg.githubToken).toBe('ghp_only_123')
    })
  })

  it('prefers A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN when both set', () => {
    withEnv({ GITHUB_TOKEN: 'ghp_default_456', A5C_AGENT_GITHUB_TOKEN: 'gho_override_789' }, () => {
      const cfg = loadConfig()
      expect(cfg.githubToken).toBe('gho_override_789')
    })
  })
})

