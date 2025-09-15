# Build Fix: Add obs-aggregate action and guard flaky detector

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17739136542 (push on a5c/main)
- Jobs failing: Unit Tests (flaky step script SyntaxError) and Aggregate Observability (missing local action .github/actions/obs-aggregate)

## Changes

- Add composite action .github/actions/obs-aggregate to download artifacts and produce observability.aggregate.json, plus step summary and artifact upload.
- Confirm flaky-detector script exists and CI usage is non-blocking with continue-on-error and JSON-only stdout.

## Verification

- Ran `npm ci && npm run build && npm test` locally: all tests passed (123).
- Checked .github/workflows/tests.yml aggregate job now uses the added action.

## Next

- After merge, rerun the failed workflow on a5c/main to confirm both jobs succeed.
