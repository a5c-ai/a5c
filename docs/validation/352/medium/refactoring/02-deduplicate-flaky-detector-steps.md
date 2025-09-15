# [Validator] [Refactoring] - Deduplicate flaky-detector steps in tests workflow

## Context

File: `.github/workflows/tests.yml`

Two separate steps named "Flaky tests detection" exist. Both generate a JSON summary via `scripts/flaky-detector.cjs` and then upsert a PR comment/label using `gh`. The logic is largely duplicated with minor variations (env and comment upsert code paths).

## Why this matters

- Duplication increases maintenance overhead and the chance of drift/bugs.
- Consolidation simplifies CI logs and reduces execution time marginally.

## Suggested change

- Keep a single step (prefer the second variant that already gates on PRs and sets `GH_TOKEN`).
- Ensure the step:
  - Runs `node scripts/flaky-detector.cjs > /tmp/flaky.json` best-effort.
  - Upserts a comment in PRs with the stable `<!-- a5c:flaky-detector -->` marker.
  - Creates the `flaky-test` label if missing and applies it only when `found: true`.
  - Uses consistent `execSync` calls guarded by try/catch.

## Acceptance criteria

- Only one "Flaky tests detection" step remains in the workflow.
- Behavior is unchanged for PRs; no-op for push events.
- CI passes and produces the same formatted comment and label behavior.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
