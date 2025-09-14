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

  it('masks Slack/AWS/Basic Auth patterns in strings', () => {
    const input = 'xoxb-1234567890-abcdefghijkl https://user:secret@example.com AKIA1234567890ABCD'
    const got = redactString(input)
    expect(got).toBe('REDACTED')
  })

  it('masks representative fixture payload values', () => {
    const json = JSON.parse(
      require('node:fs').readFileSync('tests/fixtures/redaction/sample-with-secrets.json', 'utf8')
    )
    const got = redactObject(json)
    const s = JSON.stringify(got)
    expect(s).toContain('REDACTED')
    // ensure no known tokens leak
    expect(s).not.toMatch(/gh[pouse]_[A-Za-z0-9]{10,}/)
    expect(s).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{10,}/i)
    expect(s).not.toMatch(/https?:\/\/[A-Za-z0-9._%-]+:[^@\s]+@/)
    expect(s).not.toMatch(/xox[abprs]-/)
    expect(s).not.toMatch(/AKIA[0-9A-Z]{16}/)
  })
})
