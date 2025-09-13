import { describe, it, expect } from 'vitest'
import { redactString, redactObject, redactEnv } from '../src/utils/redact'

describe('redaction', () => {
  it('masks GitHub PAT in string', () => {
    const got = redactString('token ghp_1234567890abcdef1234567890abcdef1234')
    expect(got).toBe('token REDACTED')
  })

  it('masks JWT in string', () => {
    const got = redactString('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.sgn')
    expect(got).toBe('REDACTED')
  })

  it('masks sensitive keys in objects', () => {
    const input = { password: 'supersecret', nested: { api_key: 'abc' } }
    const got = redactObject(input)
    expect(got).toEqual({ password: 'REDACTED', nested: { api_key: 'REDACTED' } })
  })

  it('masks bearer tokens in non-sensitive keys but preserves others', () => {
    const input = { note: 'Bearer abcdefghijklmnop', ok: 'hello' }
    const got = redactObject(input)
    expect(got).toEqual({ note: 'REDACTED', ok: 'hello' })
  })

  it('masks env-like object values', () => {
    const input = { STRIPE_SECRET_KEY: 'sk_live_abcdef0123456789', NORMAL: 'x' }
    const got = redactEnv(input)
    expect(got).toEqual({ STRIPE_SECRET_KEY: 'REDACTED', NORMAL: 'x' })
  })
})
