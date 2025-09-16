# Coverage Guidance

Confirm local tests with coverage before opening a PR and watch CI signals.

- Run locally:
  - `npm test` for unit tests
  - `npm run test:ci` for CI-like run with coverage/JUnit reporters
- Check summary: Vitest writes coverage reports to `coverage/` and posts a job
  summary table in CI. Totals are aggregated into observability artifacts.
- Thresholds: See `vitest.config.ts` `coverage.thresholds`. PRs should avoid
  large regressions. Small fluctuations are acceptable unless they trip CI.
- Scope: We focus on `src/**`. Some entrypoints (e.g., CLI wrappers) may be
  excluded or lightly tested depending on instrumentation feasibility; see
  repository docs and prior CI notes in `docs/dev/*` for rationale.

If coverage drops cause CI failures, consider adding or adjusting tests for the
changed areas or coordinate with maintainers if the change is structural.
