import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

function run(args: string[], input?: string): { stdout: string; status: number } {
  const bin = 'node'
  const cli = 'dist/cli.js'
  const opts: any = { encoding: 'utf8' }
  if (input != null) opts.input = input
  try {
    const out = execFileSync(bin, [cli, ...args], opts)
    return { stdout: String(out).trim(), status: 0 }
  } catch (e: any) {
    const stdout = (e?.stdout ? String(e.stdout) : '').trim()
    const status = typeof e?.status === 'number' ? e.status : 1
    return { stdout, status }
  }
}

describe('events validate (CLI)', () => {
  it('validates a normalized sample and returns valid: true', () => {
    const sample = JSON.parse(readFileSync('samples/workflow_run.completed.json', 'utf8'))
    // Ensure sample is normalized first: use normalize handler output shape via script entry
    const normalized = JSON.parse(
      execFileSync('node', ['dist/cli.js', 'normalize', '--in', 'samples/workflow_run.completed.json'], { encoding: 'utf8' })
    )
    expect(normalized.provider).toBe('github')
    const { stdout, status } = run(['validate', '--schema', 'docs/specs/ne.schema.json'], JSON.stringify(normalized))
    expect(status).toBe(0)
    const parsed = JSON.parse(stdout)
    expect(parsed.valid).toBe(true)
  })

  it('reports errors for invalid payload', () => {
    const bad = { foo: 'bar' }
    const { stdout, status } = run(['validate', '--schema', 'docs/specs/ne.schema.json'], JSON.stringify(bad))
    expect(status).toBe(2)
    const parsed = JSON.parse(stdout)
    expect(parsed.valid).toBe(false)
    expect(parsed.errorCount).toBeGreaterThan(0)
    expect(Array.isArray(parsed.errors)).toBe(true)
  })
})
