import { describe, it, expect } from 'vitest'
import { NormalizedEventSchema } from '../src/schema/normalized-event.js'
import fs from 'node:fs'

describe('NE Zod schema', () => {
  it('parses a normalized sample (workflow_run)', () => {
    const normalized = JSON.parse(fs.readFileSync('tests/fixtures/goldens/workflow_run.completed.normalize.json', 'utf8'))
    // Test fixtures use placeholder for occurred_at; replace with a valid ISO string for runtime validation
    normalized.occurred_at = new Date('2025-09-13T10:44:59Z').toISOString()
    const res = NormalizedEventSchema.safeParse(normalized)
    if (!res.success) {
      const issues = res.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
      throw new Error('Zod validation failed:\n' + issues)
    }
    expect(res.success).toBe(true)
  })

  it('rejects invalid provider', () => {
    const normalized = JSON.parse(fs.readFileSync('tests/fixtures/goldens/push.normalize.json', 'utf8'))
    const bad = { ...normalized, provider: 'gitlab' }
    const res = NormalizedEventSchema.safeParse(bad)
    expect(res.success).toBe(false)
  })
})
