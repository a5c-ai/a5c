import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const tsxBin = path.resolve('node_modules/.bin/tsx')
const cliTs = path.resolve('src/cli.ts')

function runCLI(args: string[], opts?: { env?: NodeJS.ProcessEnv }) {
  const env = { ...process.env, ...(opts?.env || {}) }
  // Ensure tokens are not inherited unless explicitly set
  delete env.GITHUB_TOKEN
  delete env.A5C_AGENT_GITHUB_TOKEN
  const res = spawnSync(tsxBin, [cliTs, ...args], {
    encoding: 'utf8',
    env,
  })
  return res
}

describe('CLI exit codes', () => {
  it('normalize: exits 2 when --in is missing (source=cli)', () => {
    const res = runCLI(['normalize'])
    expect(res.status, res.stderr).toBe(2)
    expect(res.stderr).toMatch(/missing --in|Missing required --in/i)
  })

  it('normalize: exits 2 on invalid JSON input', () => {
    const tmp = path.join(process.cwd(), 'tmp.invalid.json')
    fs.writeFileSync(tmp, '{ invalid-json', 'utf8')
    const res = runCLI(['normalize', '--in', tmp])
    try { fs.unlinkSync(tmp) } catch {}
    expect(res.status, res.stderr).toBe(2)
    expect(res.stderr).toMatch(/Invalid JSON|Unexpected token/i)
  })

  it('enrich: exits 3 when --use-github is set but no token (provider failure)', () => {
    const inFile = path.resolve('tests/fixtures/github/pull_request.synchronize.json')
    const res = runCLI(['enrich', '--in', inFile, '--use-github'])
    expect(res.status, res.stderr).toBe(3)
    expect(res.stderr).toMatch(/GitHub enrichment failed|token is required/i)
  })

  it('enrich: exits 0 without --use-github even when no token', () => {
    const inFile = path.resolve('tests/fixtures/github/pull_request.synchronize.json')
    const res = runCLI(['enrich', '--in', inFile])
    expect(res.status, res.stderr).toBe(0)
    expect(res.stdout).toMatch(/"provider":\s*"github"/)
  })
})

