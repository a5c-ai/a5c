# [Low] Docs nuance: SDK token-missing vs injected Octokit

- Category: documentation
- Priority: low

The README line says:

> For programmatic SDK usage and tests with an injected Octokit, a partial structure with `reason: "token:missing"` may be returned.

Code review indicates the `token:missing` shape occurs when `flags.use_github` is true and neither a token nor an injected `octokit` is provided (see `src/enrich.ts`). When an `octokit` is injected without a token, `enrichGithubEvent.js` throws (token required) and `handleEnrich()` returns a partial structure with an `errors` array — not `reason: "token:missing"`.

Suggested tweak (non-blocking):

- Rephrase to: "For programmatic SDK usage, if `--use-github`-equivalent is enabled without a token and no Octokit is injected, a partial structure with `reason: 'token:missing'` may be returned. When an Octokit is injected but no token is set, the structure is partial and includes `errors` with the failure details."

References:

- `src/enrich.ts` (token handling and `octokit` injection)
- `src/commands/enrich.ts` (test-time Octokit injection)
- `src/enrichGithubEvent.js` (throws when token missing)
