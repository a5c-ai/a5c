import { describe, it, expect, beforeEach, afterEach } from 'vitest'
// important: import lazily within tests to pick up current env values

const ORIGINAL_ENV = { ...process.env }

function resetEnv() {
  // restore to original
  for (const k of Object.keys(process.env)) delete (process.env as any)[k]
  Object.assign(process.env, ORIGINAL_ENV)
  delete (process.env as any).A5C_AGENT_GITHUB_TOKEN
  delete (process.env as any).GITHUB_TOKEN
  delete (process.env as any).DEBUG
}

describe('config.loadConfig token precedence and debug parsing', () => {
  beforeEach(() => {
    resetEnv()
  })

  afterEach(() => {
    resetEnv()
  })

  it('githubToken is undefined when no env tokens provided', async () => {
    const { loadConfig } = await import('../src/config')
    const cfg = loadConfig()
    expect(cfg.githubToken).toBeUndefined()
  })

  it('uses GITHUB_TOKEN when only GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'ghp_only_1234567890abcdef1234567890abcdef'
    const { loadConfig } = await import('../src/config')
    const cfg = loadConfig()
    expect(cfg.githubToken).toBe('ghp_only_1234567890abcdef1234567890abcdef')
  })

  it('prefers A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN when both set', async () => {
    process.env.GITHUB_TOKEN = 'ghp_base_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    process.env.A5C_AGENT_GITHUB_TOKEN = 'ghs_override_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    const { loadConfig } = await import('../src/config')
    const cfg = loadConfig()
    expect(cfg.githubToken).toBe('ghs_override_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
  })

  it('parses DEBUG only when equals "true" (case-insensitive)', async () => {
    process.env.DEBUG = 'TRUE'
    const { loadConfig } = await import('../src/config')
    expect(loadConfig().debug).toBe(true)

    process.env.DEBUG = 'false'
    expect(loadConfig().debug).toBe(false)

    process.env.DEBUG = '1'
    expect(loadConfig().debug).toBe(false)

    delete process.env.DEBUG
    expect(loadConfig().debug).toBe(false)
  })
})

