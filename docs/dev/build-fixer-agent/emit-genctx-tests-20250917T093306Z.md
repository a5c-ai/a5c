# Build Fix: emit labels parse + template `this`

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17793064376
- Commit: c2ecd1d7fda184bf8deac19d1d09653a80bb5d3a

## Symptoms

- TypeError: fn.parseGithubEntity is not a function
- AssertionError: expected output to match /List: x y/

## Plan

- Export `parseGithubEntity` from `src/emit.ts`
- Bind `this` inside template eval for `{{ this }}` in `src/generateContext.ts`
- Run tests locally (vitest)

## Results

- Local run: `./scripts/test.sh` passed (162 tests).
- Opened PR https://github.com/a5c-ai/events/pull/788

## Notes

- Adjusted template engine to bind JS `this` so `{{ this }}` works within `#each`.
