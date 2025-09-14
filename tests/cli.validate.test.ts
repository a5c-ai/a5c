import { describe, it, expect } from 'vitest'
import { cmdNormalize } from '../src/commands/normalize.js'
import { cmdEnrich } from '../src/commands/enrich.js'
import { validateNE } from '../src/validate.js'

describe('CLI --validate integration', () => {
  it('normalize(sample) validates against NE schema', async () => {
    const { code, output } = await cmdNormalize({ in: 'samples/push.json', source: 'cli', labels: [] })
    expect(code).toBe(0)
    expect(output).toBeTruthy()
    const res = validateNE(output)
    expect(res.valid).toBe(true)
  })

  it('enrich(sample) validates against NE schema', async () => {
    const { code: nCode, output: ne } = await cmdNormalize({ in: 'samples/push.json', source: 'cli', labels: [] })
    expect(nCode).toBe(0)
    const tmpPath = 'samples/push.normalized.json'
    // use in-memory object; cmdEnrich expects a file path
    // Write a temp fixture to disk for this test
    const fs = await import('node:fs')
    fs.writeFileSync(tmpPath, JSON.stringify(ne, null, 2))
    try {
      const { code, output } = await cmdEnrich({ in: tmpPath, labels: [], rules: undefined, flags: {} })
      expect(code).toBe(0)
      const res = validateNE(output)
      expect(res.valid).toBe(true)
    } finally {
      try { fs.unlinkSync(tmpPath) } catch {}
    }
  })

  it('invalid object fails validation (missing required fields)', async () => {
    const invalid: any = { provider: 'github' }
    const res = validateNE(invalid)
    expect(res.valid).toBe(false)
    expect(res.errors.length).toBeGreaterThan(0)
  })
})

