# Issue #384: Optional Codecov upload + README badge — Coverage

Status: draft

## Context

- Vitest already emits `lcov` and `json-summary`.
- Workflows (`tests.yml`, `pr-tests.yml`, `quick-checks.yml`) upload coverage artifacts and render summaries.
- No external dashboard currently.

## Plan

1. Ensure guarded Codecov upload steps exist using `codecov/codecov-action@v4`.
2. Guard with `if: env.CODECOV_TOKEN != ''` and set `CODECOV_TOKEN` from repo/org secret. Do not fail when missing.
3. Update `README.md` with a Codecov badge for branch `a5c/main`.
4. Keep uploads on `push` and `pull_request` events.
5. Document how to enable: add `CODECOV_TOKEN` secret at repo level.

## Acceptance

- When secret present, uploads succeed and dashboards update.
- When absent, steps are skipped; no noise.
- README badge renders when Codecov is enabled, otherwise shows unknown.

## Notes

- Action: https://github.com/codecov/codecov-action (v4)
- Inputs: `token`, `files: coverage/lcov.info`, `fail_ci_if_error: false`, `verbose: true`.
