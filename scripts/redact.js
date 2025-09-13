#!/usr/bin/env node
/**
 * Redaction utilities for masking secrets in strings, objects, and process env.
 * Usage:
 *   const { redactString, redactObject, redactEnv, buildRedactor } = require('./redact');
 */

const DEFAULT_MASK = 'REDACTED';

// Common sensitive key substrings to match case-insensitively
const DEFAULT_SENSITIVE_KEYS = [
  'token', 'secret', 'password', 'passwd', 'pwd', 'api_key', 'apikey', 'key',
  'client_secret', 'access_token', 'refresh_token', 'private_key', 'ssh_key',
  'db_password', 'db_pass', 'jwt', 'bearer', 'credential', 'authorization',
  'auth', 'session', 'cookie', 'webhook_secret'
];

// Regexes for common secret patterns
const DEFAULT_PATTERNS = [
  // GitHub PAT: ghp_, gho_, ghu_, ghs_, ghe_
  /gh[pouse]_[A-Za-z0-9]{36,}/g,
  // JWT (base64url.header.base64url.payload.base64url.signature)
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  // Bearer tokens in headers or strings
  /Bearer\s+[A-Za-z0-9._-]{10,}/gi,
  // AWS Access Key ID (AKIA or ASIA) and Secret Access Key
  /AKIA[0-9A-Z]{16}/g,
  /ASIA[0-9A-Z]{16}/g,
  /(?:aws)?_?secret(?:_access)?_key\s*[:=]\s*['\"][A-Za-z0-9\/+]{30,}['\"]/gi,
  // Stripe secret keys
  /sk_live_[A-Za-z0-9]{16,}/g,
  /sk_test_[A-Za-z0-9]{16,}/g,
  // Slack tokens
  /xox[abprs]-[A-Za-z0-9-]{10,}/g,
  // URL basic auth: https://user:pass@host
  /https?:\/\/[A-Za-z0-9._%-]+:[^@\s]+@/g,
];

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function redactString(input, opts = {}) {
  if (typeof input !== 'string') return input;
  const mask = opts.mask || DEFAULT_MASK;
  const patterns = opts.patterns || DEFAULT_PATTERNS;
  let out = input;
  for (const re of patterns) {
    try { out = out.replace(re, mask); } catch { /* ignore */ }
  }
  return out;
}

function redactObject(obj, opts = {}) {
  const mask = opts.mask || DEFAULT_MASK;
  const sensitiveKeys = (opts.sensitiveKeys || DEFAULT_SENSITIVE_KEYS).map(k => k.toLowerCase());
  const patterns = opts.patterns || DEFAULT_PATTERNS;
  const seen = new WeakSet();

  function walk(value) {
    if (typeof value === 'string') return redactString(value, { mask, patterns });
    if (Array.isArray(value)) return value.map(walk);
    if (isObject(value)) {
      if (seen.has(value)) return value; // prevent cycles
      seen.add(value);
      const out = Array.isArray(value) ? [] : {};
      for (const [k, v] of Object.entries(value)) {
        const lower = k.toLowerCase();
        const isSensitive = sensitiveKeys.some(sk => lower.includes(sk));
        if (isSensitive) {
          out[k] = mask;
        } else if (typeof v === 'string') {
          out[k] = redactString(v, { mask, patterns });
        } else {
          out[k] = walk(v);
        }
      }
      return out;
    }
    return value;
  }
  return walk(obj);
}

function redactEnv(env = process.env, opts = {}) {
  const clone = { ...env };
  return redactObject(clone, opts);
}

function buildRedactor(opts = {}) {
  return {
    mask: opts.mask || DEFAULT_MASK,
    redactString: (s) => redactString(s, opts),
    redactObject: (o) => redactObject(o, opts),
    redactEnv: (e) => redactEnv(e, opts),
  };
}

module.exports = {
  DEFAULT_MASK,
  DEFAULT_SENSITIVE_KEYS,
  DEFAULT_PATTERNS,
  redactString,
  redactObject,
  redactEnv,
  buildRedactor,
};

// CLI usage: echo JSON or string | scripts/redact.js
if (require.main === module) {
  const fs = require('fs');
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (buf += d));
  process.stdin.on('end', () => {
    const r = buildRedactor();
    const trimmed = buf.trim();
    try {
      const parsed = JSON.parse(trimmed);
      const red = r.redactObject(parsed);
      process.stdout.write(JSON.stringify(red));
    } catch {
      process.stdout.write(r.redactString(trimmed));
    }
  });
}

