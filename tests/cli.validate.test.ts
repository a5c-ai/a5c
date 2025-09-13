import { describe, it, expect } from 'vitest'
import { handleNormalize } from '../src/normalize.js'
import { validateNE } from '../src/validate.js'

describe('CLI --validate (core)', () => {
  it('valid normalized output passes', async () => {
    const { output } = await handleNormalize({ in: 'samples/push.json', source: 'cli', labels: ['env=test'] })
    const res = await validateNE(output)
    expect(res.valid).toBe(true)
  })

  it('invalid payload fails', async () => {
    // Remove a required field
    const { output } = await handleNormalize({ in: 'samples/push.json', source: 'cli', labels: ['env=test'] })
    // @ts-expect-error force invalid
    delete (output as any).id
    const res = await validateNE(output)
    expect(res.valid).toBe(false)
  })
})

