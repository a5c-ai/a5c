# Integration: GitHub Actions

## Workflows

- Quick checks on PRs (build, unit tests)
- Release pipeline on `a5c/main` push (publish)

## Usage Examples

- Normalize current run and save artifact
- Enrich PR events with CODEOWNERS and conflicts

## Tokens: Precedence and Masking

- Precedence: `A5C_AGENT_GITHUB_TOKEN` takes priority over `GITHUB_TOKEN` when loading configuration.
  - The loader returns `githubToken = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN`.
  - Use this to override the default Actions `GITHUB_TOKEN` with a higher‑scope PAT for read APIs (e.g., code scanning, branch protection) when needed.

- Examples
  - Only `GITHUB_TOKEN` set: CLI uses it for GitHub enrichment.
  - Both set: CLI uses `A5C_AGENT_GITHUB_TOKEN`.

- Masking/Redaction in Outputs
  - CLI redacts secrets in printed JSON via `redactObject()` before writing to files/stdout.
  - Common patterns masked: GitHub tokens (`gh*_*`), JWTs, Stripe `sk_*`, AWS keys, Bearer tokens, etc.
  - Sensitive keys masked by name match: any key containing `token`, `secret`, `password`, `authorization`, etc. (case‑insensitive) will show `REDACTED`.

- Practical Guidance
  - Set `A5C_AGENT_GITHUB_TOKEN` in repo/org secrets for broader scopes; fall back to `GITHUB_TOKEN` in standard runs.
  - Never echo raw env; rely on the CLI’s masking when emitting enriched/normalized JSON.
  - Review CI logs to ensure snapshots contain `REDACTED` for any token‑like strings.

See also: `src/config.ts` and `src/utils/redact.ts` for the single source of truth.
