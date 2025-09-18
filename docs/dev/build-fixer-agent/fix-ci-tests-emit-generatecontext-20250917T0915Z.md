# Fix CI: test failures in emit and generateContext

Date: 2025-09-17T09:15Z

Branch: `fix/ci-tests-emit-generatecontext`
PR: https://github.com/a5c-ai/events/pull/778
Failed run: https://github.com/a5c-ai/events/actions/runs/17792750304

## Context

Build workflow on `a5c/main` failed (workflow_run) with 2 failing tests:

- `test/emit.labels.test.ts` — `fn.parseGithubEntity is not a function`
- `test/generateContext.test.ts` — `{{#each}}` rendered `[object global]` instead of item values

## Plan

- Export `parseGithubEntity` from `src/emit.ts`
- Bind `this` to the each-item during expression evaluation in `src/generateContext.ts`
- Run focused tests locally to confirm
- Open PR against `a5c/main` with labels (build, bug, high priority) and enable auto-merge

## Changes

- `src/emit.ts`: `export function parseGithubEntity(...)`
- `src/generateContext.ts`: use `fn.call(thisArg, ...)` where `thisArg` defaults to the loop item when present
- `.gitignore`: ignore `tmp-ctx-*` artifacts from local tests

## Verification

- Local focused tests: pass for both failing specs
- Full test suite: 62 files, 162 tests passed locally

## Notes

- No workflow or infra changes needed; this is a small product/test fix.
