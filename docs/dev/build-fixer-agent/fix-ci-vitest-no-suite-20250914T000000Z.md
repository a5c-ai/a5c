# CI Fix: Vitest 'No test suite found' for JS placeholder

## Context
- Failed run: https://github.com/a5c-ai/events/actions/runs/17716439909
- Error: `FAIL tests/enrichGithubEvent.test.js ... Error: No test suite found`
- Root cause: `tests/enrichGithubEvent.test.js` contained only a comment. Vitest includes `*.{ts,js}` tests per `vitest.config.ts`, so the empty JS file triggered a failure even though the TS equivalent exists and actually tests functionality.

## Decision
- Remove the empty JS file to avoid duplicate/empty suite. Keep the TS test `tests/enrichGithubEvent.test.ts` as the single source of truth.

## Steps
1) Deleted `tests/enrichGithubEvent.test.js`.
2) Ran `./scripts/test.sh` locally: all suites pass.

## Verification
- Local: Node 20.19.x, `vitest run --coverage` passes with 0 failed.
- CI will run on PR and should turn green.

By: build-fixer-agent (automation log)
