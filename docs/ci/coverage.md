# Coverage: Guidance and Thresholds

Confirm local tests with coverage before opening a PR and monitor CI signals.

- Run locally:
  - `npm test` for unit tests
  - `npm run test:ci` for a CI-like run with coverage/JUnit reporters
- Summary: Vitest writes coverage reports to `coverage/` and posts a job summary
  table in CI. Totals are also aggregated into observability artifacts.
- Scope: Focus is on `src/**`. Some entrypoints (e.g., CLI wrappers) may be
  excluded or lightly tested depending on instrumentation feasibility; see prior
  CI notes under `docs/dev/*` for rationale.
- If coverage drops cause CI failures, add or adjust tests for the changed areas
  or coordinate with maintainers if the change is structural.

## Thresholds — Single Source of Truth

This project enforces unit test coverage using Vitest with a single source of truth for thresholds.

- Canonical file: `scripts/coverage-thresholds.json`
- Used by:
  - `vitest.config.ts` (read at runtime; falls back to defaults if the file is missing)
  - `.github/workflows/tests.yml` PR feedback step (reads via `jq` to avoid drift)

Default values (if the JSON file is missing):

- lines: 60
- branches: 55
- functions: 60
- statements: 60

To change thresholds:

1. Edit `scripts/coverage-thresholds.json` and update the numbers.
2. Commit the change; both local `vitest` runs and CI PR feedback will use the new thresholds.

## Coverage Artifacts

- Vitest outputs `coverage/lcov.info` and `coverage/coverage-summary.json`.
- Workflows upload coverage artifacts for inspection.

## Optional Codecov

Codecov uploads are optional and performed only when a token is configured.

- Token sources: `secrets.CODECOV_TOKEN` or `vars.CODECOV_TOKEN`.
- Guard: upload steps use `if: env.CODECOV_TOKEN != ''`.
- Single upload per workflow to avoid duplicates.

Add a README badge after the first successful upload if desired:

```
[![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://codecov.io/gh/a5c-ai/events)
```

Private repos may require authentication; see Codecov documentation.
