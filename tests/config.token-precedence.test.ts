import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../src/config'

const ORIGINAL_ENV = { ...process.env }

describe('config token precedence', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.A5C_AGENT_GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('prefers A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN when both set', () => {
    process.env.GITHUB_TOKEN = 'ghp_from_github_token'
    process.env.A5C_AGENT_GITHUB_TOKEN = 'ghp_from_agent_token'
    const cfg = loadConfig()
    expect(cfg.githubToken).toBe('ghp_from_agent_token')
  })

  it('falls back to GITHUB_TOKEN when agent token missing', () => {
    process.env.GITHUB_TOKEN = 'ghp_only_github'
    const cfg = loadConfig()
    expect(cfg.githubToken).toBe('ghp_only_github')
  })

  it('is undefined when neither token is present', () => {
    const cfg = loadConfig()
    expect(cfg.githubToken).toBeUndefined()
  })
})

