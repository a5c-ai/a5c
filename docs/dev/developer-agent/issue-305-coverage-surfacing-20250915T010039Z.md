# Work Log — Issue #305 — Test coverage surfacing in CI

## Summary

Implement clear coverage surfacing in CI and PRs using Vitest coverage reports and GitHub summaries/comments.

## Plan

- Keep Vitest coverage: text + lcov + json-summary, thresholds enforced
- Reuse a small script to render coverage markdown from coverage-summary.json
- Update tests workflow to:
  - Upload lcov artifact
  - Append coverage table to job summary (Checks)
  - Post or update a sticky PR comment with the same table on PRs
- Document badge decision (optional; not adding for now)

## Acceptance targets

- Coverage artifact is uploaded
- Checks summary shows coverage
- PR comment posted/updated on PRs
- Thresholds enforced, failing the job when below

## Notes

No badge added to README to avoid churn/noise; can be revisited.
