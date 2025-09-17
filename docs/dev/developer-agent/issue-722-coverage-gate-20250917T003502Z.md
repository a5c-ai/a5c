# Issue #722 — Optional hard coverage gate (REQUIRE_COVERAGE)

## Goal

Add a conditional hard gate in PR tests that fails when coverage is below thresholds from `scripts/coverage-thresholds.json` and repo var `REQUIRE_COVERAGE` is `true`.

## Plan

- Reuse existing parsing of `coverage/coverage-summary.json` in `pr-tests.yml`.
- Add a step after PR feedback that compares metrics and exits 1 when below thresholds.
- Guard step with `if: ${{ vars.REQUIRE_COVERAGE == 'true' }}` to default to soft feedback.
- Keep labels/comments step for visibility regardless of failure (gate runs after it).

## Notes

- Thresholds already loaded in vitest and workflows; we keep single source of truth.
- Logs will show a table of actual vs thresholds and failing metrics.
