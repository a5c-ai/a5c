# Extract vitest JSON aggregation logic from Action

Priority: medium
Category: refactoring

## Issue

The logic that parses `vitest-results.json` (aggregation of retries and slow tests) is embedded inline in `.github/actions/obs-summary/action.yml` inside `node -e` snippets. This makes the logic harder to lint/test and to evolve.

## Recommendation

- Move the JSON aggregation into a small Node script (e.g., `scripts/ci/tests-summary.js`).
- Export a function that reads `vitest-results.json` and returns `{ totals, slowest, flaky }`.
- In the action, `node scripts/ci/tests-summary.js > /tmp/tests.json` and merge into `observability.json` and step summary.

## Rationale

- Improves maintainability, debuggability, and enables unit tests for the aggregation logic.

## Acceptance

- Action uses the script; behavior remains identical; tests summary appears in both `observability.json` and step summary.
