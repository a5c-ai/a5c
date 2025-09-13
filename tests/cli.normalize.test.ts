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

describe('CLI normalize (smoke)', () => {
  it('reads a sample and outputs normalized event shape', () => {
    const sample = resolve('samples/push.json')
    const out = runCli(['normalize', '--in', sample, '--label', 'env=test'])
    const obj = JSON.parse(out)
    expect(obj).toBeTruthy()
    expect(typeof obj.id).toBe('string')
    expect(obj.provider).toBe('github')
    expect(typeof obj.occurred_at).toBe('string')
    expect(Array.isArray(obj.labels)).toBe(true)
    expect(obj.labels).toContain('env=test')
    // payload should echo input
    expect(obj.payload).toBeTypeOf('object')
  })
})

