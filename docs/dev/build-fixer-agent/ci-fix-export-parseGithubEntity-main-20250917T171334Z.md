# CI Fix: export parseGithubEntity for main

- Failure: `TypeError: fn.parseGithubEntity is not a function` in `test/emit.labels.test.ts` on `main`.
- Root cause: `parseGithubEntity` existed in `src/emit.ts` but was not exported on `main`.
- Note: `a5c/main` already contains the fix and passes tests.

## Changes

- Export `parseGithubEntity` and `resolveOwnerRepo` from `src/emit.ts`.

## Verification

- Ran `npm ci && npm run -s test:ci` locally on branch: all tests pass (162).

References:

- Issue: #837
- Failing run: https://github.com/a5c-ai/events/actions/runs/17803318898
