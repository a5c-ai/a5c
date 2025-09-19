# Work Log: Issue #1020 — Coverage Gate Policy for a5c/main PRs

## Context

- Goal: Document coverage gate policy and thresholds ownership.
- Inputs: `vitest.config.ts`, `.github/workflows/*`, `scripts/coverage-thresholds.json`.

## Plan

- Add "Coverage Gate" section to `CONTRIBUTING.md` with:
  - When gate applies: PRs targeting `a5c/main`.
  - How gate is toggled: `vars.REQUIRE_COVERAGE` (repo variable) or workflow env.
  - Thresholds source of truth: `scripts/coverage-thresholds.json`.
  - Update process: adjust JSON via PR.
  - Temporary override: toggle var off for exceptional cases.
- Cross-link workflows and vitest config.

## Notes

- Current thresholds (from file): lines 55, branches 55, functions 60, statements 55.
- Vitest fallback thresholds (when no file): lines 60, branches 55, functions 60, statements 60.

## Next

- Implement docs, then open PR.
