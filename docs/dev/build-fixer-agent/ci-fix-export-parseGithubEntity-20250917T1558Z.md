# CI Fix: export parseGithubEntity from src/emit.ts

- Trigger: Failed run https://github.com/a5c-ai/events/actions/runs/17803316391 on branch `a5c/main`
- Failure: `TypeError: fn.parseGithubEntity is not a function` in `test/emit.labels.test.ts`
- Root cause: `parseGithubEntity` existed in `src/emit.ts` but was not exported, so `import * as mod from "../src/emit.js"` in tests could not access it.

## Plan

- Export `parseGithubEntity` from `src/emit.ts`
- Install deps and run full test suite locally
- Open PR with context and verification steps

## Changes

- src/emit.ts: `function parseGithubEntity` -> `export function parseGithubEntity`

## Verification

- Ran `npm ci`
- Ran `npm run -s test:ci` – all tests passed locally (62 files, 162 tests)

## Links

- Failing run: https://github.com/a5c-ai/events/actions/runs/17803316391
- Commit under test: 2cfe5f4c1118fecb115aba7c4eacfaddb18bca7e

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
