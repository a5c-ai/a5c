# Fix CI failure: emit default sink

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17794970623 (job: test)
- Failure: 1 failing test — tests/emit.basic.test.ts "writes to stdout by default and returns code 0"
- Observed locally: handleEmit defaults to `github` sink without token, returning code 1.

## Root Cause

`src/emit.ts` sets default sink to `github` when `--out` is not provided. Tests and CLI docs expect stdout to be the default.

## Plan

- Change default sink to `stdout` when no `--out` and no explicit `--sink`.
- Run tests locally to confirm all pass.
- Open PR against `a5c/main` with labels: build, bug; priority: high priority.

## Links

- Workflow: https://github.com/a5c-ai/events/actions/runs/17794970623
