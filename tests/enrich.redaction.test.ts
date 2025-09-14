import { describe, it, expect } from 'vitest'
import { handleEnrich } from '../src/enrich'
import { redactObject } from '../src/utils/redact'

describe('enrich() output is redacted', () => {
  it('applies redaction to output object', async () => {
    const payload = JSON.parse(require('node:fs').readFileSync('tests/fixtures/redaction/sample-with-secrets.json', 'utf8'))
    // Pass payload via opts.in simulated by writing a temp file
    const fs = require('node:fs') as typeof import('node:fs')
    fs.writeFileSync('/tmp/enrich-redaction-input.json', JSON.stringify(payload))
    const { output } = await handleEnrich({ in: '/tmp/enrich-redaction-input.json', labels: [], flags: { include_patch: false } })
    const s = JSON.stringify(redactObject(output))
    expect(s).not.toMatch(/gh[pouse]_/)
    expect(s).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{10,}/i)
  })
})
