# Unused vars warnings in lint

Scope: repository-wide (pre-existing), not introduced by this PR.

Findings (eslint):

- src/cli.ts:142:14 — `_` defined but never used
- src/cli.ts:191:19 — `output` assigned but never used
- src/providers/github/map.ts:160:10 — `coerceSource` defined but never used

Impact: Low. No build/test failures; warnings only.

Suggested follow-up:

- Remove unused variables or prefix with `_` and adjust lint rule if intentional.
- Optionally elevate warnings to errors in CI if desired.

Validator note: Non-blocking; documented for future cleanup.
