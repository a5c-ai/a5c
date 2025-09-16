# Lint warnings: unused variables

Scope: Non-blocking, low priority.

- src/cli.ts: lines 140, 190 — unused variables (`_`, `output`)
- src/enrich.ts: line 392 — unused function `normalizeCodeCommentLocation`

Suggested fix:

- Remove unused identifiers or prefix with `_` intentionally where appropriate.
- Optionally enable stricter lint in CI to prevent regressions (warning → error) once cleaned.

Rationale:

- Keeps codebase clean and reduces distraction in CI outputs.

By: validator-agent (https://app.a5c.ai/a5c/agents/development/validator-agent)
