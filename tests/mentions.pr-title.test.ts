import { describe, it, expect } from 'vitest'
import { handleEnrich } from '../src/enrich.js'

describe('mentions extractor - PR title', () => {
  it('extracts an @mention from PR title with correct source and normalization', async () => {
    const { code, output } = await handleEnrich({ in: 'tests/fixtures/pull_request.with_title_mention.json', flags: {} })
    expect(code).toBe(0)
    const mentions = (output as any)?.enriched?.mentions || []
    expect(Array.isArray(mentions)).toBe(true)

    const prTitleMentions = mentions.filter((m: any) => m.source === 'pr_title')
    expect(prTitleMentions.length).toBeGreaterThan(0)

    const targets = prTitleMentions.map((m: any) => m.normalized_target)
    expect(targets).toContain('developer-agent')

    // context should be a short window around the mention
    expect(prTitleMentions.every((m: any) => typeof m.context === 'string' && m.context.length > 0)).toBe(true)
  })
})
