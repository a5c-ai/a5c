# Vitest: enable JUnit + retries and surface flaky suspects (Issue #348)

## Plan

- Ensure Vitest config enables junit, json reporters and CI retries
- Simplify `test:ci` to rely on config-provided reporters
- Extend `.github/actions/obs-summary` to parse vitest JSON for retries/slow tests and add to `observability.json`
- Upload `vitest-results.json` artifact in tests workflow

## Changes

- `vitest.config.ts`: add `json` reporter -> `vitest-results.json`
- `package.json`: `test:ci` now `vitest run --coverage`
- `.github/actions/obs-summary/action.yml`: parse `vitest-results.json`, add `tests` section, append summary of flaky/slow
- `.github/workflows/tests.yml`: upload `vitest-results.json` as artifact

## Notes

- Vitest 2.x JSON reporter uses Jest-like shape with `assertionResults[].meta` carrying `retryCount` when retries occur.
- Slowest list is capped to top 10 in JSON, top 5 in summary.
