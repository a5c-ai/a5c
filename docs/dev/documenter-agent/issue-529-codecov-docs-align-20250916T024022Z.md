# Issue #529 – Align Codecov docs with existing workflows

## Context

PR #523 introduced a script-based uploader in docs. Current workflows already use `codecov/codecov-action@v4` guarded by a token.

## Plan

- Prefer Action-based upload in CI; provide snippet with `if: ${{ secrets.CODECOV_TOKEN != '' }}` and `with.token`.
- Keep script uploader as an alternative (local/non-Actions CI) and warn against double uploads.
- Update README Coverage and docs/ci/ci-checks.md.

## Notes

- Workflows reference: `.github/workflows/tests.yml`, `quick-checks.yml`, `pr-tests.yml`.
- Token source: `secrets.CODECOV_TOKEN` (or `vars.CODECOV_TOKEN` as fallback where relevant).
