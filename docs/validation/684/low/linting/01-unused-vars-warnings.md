# Lint: Unused variables (non-blocking)

Detected during validator run for PR #684 (branch `docs/dedupe-specs-select-filter-674`).

- src/cli.ts:142 — `_` is defined but never used (@typescript-eslint/no-unused-vars)
- src/cli.ts:191 — `output` is assigned a value but never used (@typescript-eslint/no-unused-vars)
- src/providers/github/map.ts:160 — `coerceSource` is defined but never used (@typescript-eslint/no-unused-vars)

These are non-blocking and do not affect build or tests; consider cleanup in a follow-up or opportunistically in nearby changes.

Priority: low
