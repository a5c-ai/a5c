# Token Precedence and Redaction

- Token precedence: environment variable `A5C_AGENT_GITHUB_TOKEN` takes precedence over `GITHUB_TOKEN` when both are present. See `src/config.ts` and CLI reference.
- Redaction: output and logs mask known secret patterns and keys using `src/utils/redact.ts` with default mask `REDACTED`.
  - Patterns include: GitHub PATs (`ghp_*`), JWTs, `Bearer <token>`, Stripe `sk_*`, Slack `xox*`, AWS keys, URL basic auth, etc.
  - Sensitive keys matched case-insensitively: `token`, `secret`, `password`, `api_key`, `client_secret`, `access_token`, ...

Regression tests were added under `tests/` to validate behavior.
