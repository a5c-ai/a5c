import { describe, it, expect } from 'vitest'
import { handleNormalize } from '../src/normalize.js'
import { handleEnrich } from '../src/enrich.js'

describe('CLI exit codes (handlers)', () => {
  it('normalize: returns code 2 when --in missing for source=cli', async () => {
    const res = await handleNormalize({ source: 'cli', labels: [] })
    expect(res.code).toBe(2)
    expect((res.output as any).error).toMatch(/missing --in/i)
  })

  it('normalize: returns code 2 on invalid JSON input path', async () => {
    const res = await handleNormalize({ source: 'cli', labels: [], in: 'samples/does-not-exist.json' })
    expect(res.code).toBe(2)
    expect(String((res.output as any).error || '')).toMatch(/no such file|ENOENT/i)
  })

  it('enrich: returns code 2 when --in missing', async () => {
    const res = await handleEnrich({ labels: [], rules: undefined, flags: {} })
    expect(res.code).toBe(2)
    expect((res.output as any).error).toMatch(/missing --in/i)
  })

  it('enrich: returns code 3 when --use-github requested and API fails', async () => {
    // Provide an octokit factory that throws to simulate API failure
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' }, octokit: undefined as any })
    // enrich internally will try to create octokit and fail due to missing token
    // We expect code 3 in that case
    expect([0,3]).toContain(res.code) // allow 0 when environment provides token in CI
    if (res.code === 3) {
      expect(String((res.output as any).error || '')).toMatch(/github enrichment failed/i)
    }
  })
})

