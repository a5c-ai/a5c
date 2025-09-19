# Issue #991 – Default to stdout in `events emit`

## Context

Current behavior defaults sink to `github` when `--sink` and `--out` are both omitted, causing unintended network side-effects. Docs state stdout is default.

## Plan

- Change default sink resolution in `src/emit.ts` to `stdout` (keep implicit `file` when `--out` is set).
- Verify build and tests.
- Ensure `docs/cli/reference.md` matches behavior; adjust examples language if needed.

## Acceptance

- `events emit` with no flags writes to stdout and makes no API calls.
- `--out` implies file sink; no GitHub unless `--sink github`.
- Docs reflect correct defaults and include explicit `--sink github` example.

## Notes

Touch only relevant code and docs; keep changes minimal and focused.

## Results

- Implemented default sink change in `src/emit.ts` to `stdout`.
- Verified unit tests and build pass locally.
- Updated CLI reference to include “Safety by default” note under `events emit`.

## Next

- Submit PR for review, then mark ready and request @validator-agent.
