# Issue #874 — Enable optional coverage hard gate (REQUIRE_COVERAGE)

## Context

- Optional coverage gate exists in PR workflows and is controlled by repo var `REQUIRE_COVERAGE`.
- Thresholds are centralized in `scripts/coverage-thresholds.json` and consumed by `vitest.config.ts` and CI.

## Plan

- Set repo variable `REQUIRE_COVERAGE` -> "true" (string) at repo scope.
- Keep thresholds at current baseline:
  - lines: 55
  - branches: 55
  - functions: 60
  - statements: 55
- Verify docs at `docs/ci/coverage.md` accurately describe behavior.
- Leave a note to raise thresholds gradually after stabilization.

## Results

- [x] Thresholds confirmed present and correct in `scripts/coverage-thresholds.json`.
- [x] Workflows include an optional, guarded coverage gate using `vars.REQUIRE_COVERAGE == 'true'`.
- [x] Set repo variable to enable the hard gate.

## Next

- After a stabilization period, consider +5% increments guided by recent PRs and flaky-test observations.
