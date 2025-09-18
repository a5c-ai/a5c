# Fix: bind `this` in template expressions to loop item

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17828850451
- Failure: `test/generateContext.test.ts` expected `List: x y` but got `[object global]`
- Root cause: `evalExpr` evaluated expressions where bare `this` referred to the global object, not the current `#each` item.

## Plan

- Adjust `evalExpr` to call the compiled function with `this` bound to `ctx.vars.this` when present.
- Verify with full local test suite.

## Changes

- src/generateContext.ts: call the compiled expression with `.call(thisArg, ...)` where `thisArg = ctx.vars.this` if defined.

## Verification

- Ran `npm ci` and `npm test` locally: all tests passed (68 files, 179 tests, 1 skipped).

## Links

- Commit that failed run: e97f7fc63316ced4c61b9b4234e5d2be4cdf4a4c
- Workflow: .github/workflows/main.yml (test job)

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
