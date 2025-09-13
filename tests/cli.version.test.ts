import { describe, it, expect } from 'vitest'
import { getVersionSync } from '../src/version.js'
import pkg from '../package.json'

describe('CLI version sourcing', () => {
  it('reads version from package.json', () => {
    expect(getVersionSync()).toBe(pkg.version)
  })
})

