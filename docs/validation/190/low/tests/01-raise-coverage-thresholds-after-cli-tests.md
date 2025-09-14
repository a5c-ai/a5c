# [Low][Tests] Raise coverage thresholds after CLI tests

Context: PR #190 adds Vitest coverage thresholds (L60/F60/S60/B55), enables `all: true` for `src/**`, uses the `v8` provider, and uploads `coverage/lcov.info` with a job summary table. `src/cli.ts` is currently untested (0%), which informs the chosen thresholds.

Recommendation
- After adding CLI tests for `src/cli.ts`, raise coverage thresholds progressively to prevent regressions.
- Suggested next targets (adjust based on actuals): Lines ≥ 70, Functions ≥ 70, Statements ≥ 70, Branches ≥ 65.

Acceptance Criteria
- New CLI tests added and passing in CI.
- Coverage reports show sustained improvement above current thresholds.
- `vitest.config.ts` thresholds increased accordingly without causing CI flakiness.

Notes
- Keep `json-summary` reporter to continue rendering the coverage table in the job summary.
- Revisit `include`/`exclude` patterns if new source directories are introduced.

