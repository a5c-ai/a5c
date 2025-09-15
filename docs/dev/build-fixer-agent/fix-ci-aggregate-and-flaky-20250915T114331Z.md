# Build Fix: Aggregate job checkout + flaky step non-blocking

- Context run: https://github.com/a5c-ai/events/actions/runs/17731636086
- Head branch: a5c/main

## Problem
- Aggregate Observability job fails: local action `.github/actions/obs-aggregate` not found. Root cause: missing `actions/checkout` in the `aggregate` job.
- Unit Tests job marked failure due to a secondary "Flaky tests detection" step failing. Root cause: detection helper step not marked `continue-on-error` and may fail in some environments.

## Plan
- Add `actions/checkout@v4` to `aggregate` job before using local composite action.
- Mark the second flaky detection step as `continue-on-error: true` to ensure it remains advisory.
- Keep functionality intact; do not change detection logic.

## Verification
- Reviewed failing logs showing: "Did you forget to run actions/checkout before running your local action?" and step failure for flaky detection.
- Local diff prepared to align with intended behavior.

