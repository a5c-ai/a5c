# PR comments + labels on thresholds (Issue #335)

## Plan

- Add CI step that parses `coverage/coverage-summary.json` and posts a PR comment with a stable marker
- Apply labels based on configured thresholds
- Avoid duplicate comments; update in place if exists
- Ensure it runs only on PRs targeting `a5c/main`

## Notes

- thresholds currently set in `vitest.config.ts` under `coverage.thresholds`
- labels: `coverage:ok`, `coverage:low` (create if missing)
