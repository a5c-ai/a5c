import { describe, it, expect } from 'vitest'
import { handleNormalize } from '../src/normalize.js'
import { handleEnrich } from '../src/enrich.js'

describe('enrich → mentions and flags', () => {
  it('adds mentions from push commit messages', async () => {
    const enriched = await handleEnrich({ in: 'samples/push.json', labels: [], rules: undefined, flags: {} })
    const mentions = (enriched.output.enriched as any)?.mentions || []
    expect(Array.isArray(mentions)).toBe(true)
    // sample includes `@developer-agent` in one commit
    const names = mentions.map((m: any) => m.normalized_target)
    expect(names).toContain('developer-agent')
  })

  it('merges GitHub enrichment when flag enabled but missing token marks partial', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' } })
    const gh = (res.output.enriched as any)?.github
    expect(gh).toBeTruthy()
    expect(gh.partial).toBeTruthy()
  })
})
