# Optional hard coverage gate via repo var — issue #722

## Context

- Goal: Allow failing PR test workflows when coverage is below thresholds if `REQUIRE_COVERAGE=true` repo variable is set.
- Threshold source: `scripts/coverage-thresholds.json`
- Workflows touched: `.github/workflows/pr-tests.yml`, `.github/workflows/quick-checks.yml`

## Plan

1. Add shell step to compute coverage, compare to thresholds, and, if `vars.REQUIRE_COVERAGE == true`, exit non-zero when below thresholds.
2. Preserve label/comment behavior regardless of failure to keep feedback visible.
3. Guard step with `if: ${{ vars.REQUIRE_COVERAGE == 'true' }}` to avoid breaking default soft mode.
4. actionlint validate and open draft PR.

## Notes

- Uses existing `coverage/coverage-summary.json` from vitest json-summary.
- Reads thresholds via `jq` from `scripts/coverage-thresholds.json` (fallback defaults).
- Logs a clear comparison table and which metrics failed.

## Changelog

- Initial doc created.
