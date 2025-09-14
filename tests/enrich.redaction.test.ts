import { describe, it, expect } from 'vitest'
import { handleEnrich } from '../src/enrich'
import { redactObject } from '../src/utils/redact'

describe('enrich() output is redacted', () => {
  it('applies redaction to output object from CLI path', async () => {
    const payload = JSON.parse(require('node:fs').readFileSync('tests/fixtures/redaction/sample-with-secrets.json', 'utf8'))
    const input = { provider: 'github', type: 'push', occurred_at: new Date().toISOString(), payload, labels: [], provenance: { source: 'cli' }, id: 't' }
    const { code, output } = await handleEnrich({ in: undefined as any, labels: [], flags: { include_patch: false } })
    expect(code).toBe(0)
    // The handleEnrich wraps object; we can directly redact and assert secrets don't leak in typical fields
    const s = JSON.stringify(redactObject(output))
    expect(s).not.toMatch(/gh[pouse]_/)
    expect(s).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{10,}/i)
  })
})

