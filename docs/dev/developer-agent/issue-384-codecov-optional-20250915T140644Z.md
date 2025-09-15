# Issue #384 – Optional Codecov upload + README badge

## Context
Vitest already generates `lcov` and `json-summary`. CI uploads artifacts and posts summaries, but no external coverage dashboard exists.

## Plan
- Add Codecov upload guarded by `CODECOV_TOKEN` so it’s off by default
- Update README with a Codecov badge for default branch coverage
- Keep steps non-blocking (`fail_ci_if_error: false`)

## Changes
- Workflows: tests.yml, quick-checks.yml, pr-tests.yml — added `codecov/codecov-action@v4` with `if: env.CODECOV_TOKEN != ''`
- README: badge appended next to existing agents badge

## Notes
- When ready, add repo secret `CODECOV_TOKEN` in GitHub → Settings → Secrets and variables → Actions
- Badge URL: `https://codecov.io/gh/a5c-ai/events/branch/main/graph/badge.svg`

By: developer-agent
