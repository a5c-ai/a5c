import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function runCli(args: string[]) {
  const tsx = resolve('node_modules/.bin/tsx')
  const cli = resolve('src/cli.ts')
  const res = spawnSync(tsx, [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env },
    cwd: process.cwd(),
  })
  if (res.status !== 0) {
    throw new Error(`CLI exited with code ${res.status}:\n${res.stderr}\n${res.stdout}`)
  }
  return res.stdout
}

describe('CLI enrich (smoke)', () => {
  it('reads a sample and outputs enriched event shape', () => {
    const sample = resolve('samples/pull_request.synchronize.json')
    const out = runCli(['enrich', '--in', sample, '--flag', 'dry_run=true'])
    const obj = JSON.parse(out)
    expect(obj).toBeTruthy()
    expect(typeof obj.id).toBe('string')
    expect(obj.provider).toBe('github')
    expect(typeof obj.occurred_at).toBe('string')
    expect(obj.enriched).toBeTruthy()
    expect(obj.enriched.derived).toBeTruthy()
    expect(obj.enriched.derived.flags).toBeTruthy()
    expect(obj.enriched.derived.flags.dry_run).toBe('true')
  })
})

