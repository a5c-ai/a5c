import { describe, it, expect } from 'vitest'
import { redactString, redactObject } from '../src/utils/redact'

describe('redaction regression', () => {
  it('masks multiple secret types in a single string', () => {
    const input = [
      'Bearer VerySecretToken_0123456789',
      'ghp_1234567890abcdef1234567890abcdef1234',
      'https://user:pass@example.com/path',
    ].join(' ')
    const out = redactString(input)
    // Bearer and PAT fully redacted; URL basic-auth credentials removed
    expect(out).toContain('REDACTED REDACTED ')
    expect(out.includes('user:pass@')).toBe(false)
    expect(out).toContain('example.com/path')
  })

  it('masks nested structures and preserves safe fields', () => {
    const obj = {
      message: 'ok',
      headers: { Authorization: 'Bearer abcd.efgh-123456' },
      github: { token: 'ghp_abcdef0123456789abcdef0123456789abcd' },
      url: 'https://user:pw@example.org',
      list: ['sk_test_abcdef0123456789', 'hello'],
    }
    const out = redactObject(obj)
    expect(out.message).toBe('ok')
    expect(out.headers.Authorization).toBe('REDACTED')
    expect(out.github.token).toBe('REDACTED')
    // URL credentials are removed; host/path are preserved
    expect(out.url.includes('user:pw@')).toBe(false)
    expect(out.url).toContain('REDACTED')
    expect(out.list[0]).toBe('REDACTED')
    expect(out.list[1]).toBe('hello')
  })
})
