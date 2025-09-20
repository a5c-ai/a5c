# [Validator] Tests - Avoid coverage gate duplication

Priority: low

Coverage enforcement happens in two places when `REQUIRE_COVERAGE=true`:

- Vitest thresholds (via `vitest.config.ts`)
- A bash-based gate step in `quick-checks.yml`

While redundant checks can be beneficial, consider relying on Vitest thresholds only, or keeping the bash gate solely as a step-summary/reporting aid with `continue-on-error: true`. This reduces potential for false negatives and keeps gating logic in one engine.
