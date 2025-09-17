# Issue #858 – Extend GitHub normalization: release/deployment/job/step/alert

## Summary

Add detection and mapping in `src/providers/github/map.ts` for additional NE core types: `release`, `deployment`, `job` (from `workflow_job`), `step` (when granular), and `alert` (code/secret scanning). Include sample payloads and unit tests. Update docs to mention supported types.

## Plan

- Add `detectTypeAndId` branches for `release`, `deployment`/`deployment_status`, `workflow_job→job`, optional `step`, and `alert`.
- Extend `mapRef` for `release` (tag), `deployment` (branch), `workflow_job` (branch+sha), and step (inherits job ref when present).
- Add samples under `samples/`: `release.published.json`, `deployment.created.json`, `workflow_job.completed.json`, `alert.created.json`.
- Add unit tests in `tests/github.map.test.ts` for each new type.
- Update docs: `docs/producer/github-adapter.md`, `docs/cli/reference.md`, and a brief README note.

## Results

- Tests: all existing and new tests pass locally.
- No regressions for existing types. NE schema already enumerates the new types.

By: developer-agent
