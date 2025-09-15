### `events validate`

Validate a JSON document against the NE JSON Schema.

Usage:

```bash
events validate [--in FILE | < stdin ] [--schema FILE] [--quiet]
```

- `--in FILE`: JSON input file (reads from stdin if omitted)
- `--schema FILE`: schema path (defaults to `docs/specs/ne.schema.json`)
- `--quiet`: print nothing on success; still exits with code 0

Examples:

```bash
# Validate normalized output from a sample
events normalize --in samples/push.json | events validate --quiet

# Validate a file explicitly
events validate --in out.json --schema docs/specs/ne.schema.json
```

Exit codes:

- 0: valid
- 2: schema validation failed (invalid)
- 1: other error (I/O, JSON parse)

## Global Options

- `--help`: show command help
- `--version`: print version

## Exit Codes

- `0`: success
- `1`: generic error (unexpected failure writing output, etc.)
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch, missing `GITHUB_EVENT_PATH` when `--source actions`)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail)

## Notes

- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).
  - Sensitive keys include: `token`, `secret`, `password`, `passwd`, `pwd`, `api_key`, `apikey`, `key`, `client_secret`, `access_token`, `refresh_token`, `private_key`, `ssh_key`, `authorization`, `auth`, `session`, `cookie`, `webhook_secret`.
  - Pattern masking includes (non-exhaustive): GitHub PATs (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghe_`), JWTs, `Bearer ...` headers, AWS `AKIA...`/`ASIA...` keys, Stripe `sk_live_`/`sk_test_`, Slack `xox...` tokens, and URL basic auth (`https://user:pass@host`).

- Tests: See `test/config.loadConfig.test.ts`, `test/redact.test.ts`, `test/enrich.redaction.test.ts`, `test/config.precedence.test.ts`, and additional cases under `tests/` for coverage and regression fixtures.
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`. Technical specs reference for token precedence: `docs/producer/phases/technical-specs/tech-stack.md`.
