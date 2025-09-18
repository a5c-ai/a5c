# Fix: generateContext `this` binding in `#each` and outside blocks (Issue #926)

## Plan

- Reproduce locally and inspect `src/generateContext.ts`.
- Harden `evalExpr()` to eliminate global-object fallback by:
  - Evaluating in strict mode.
  - Preprocessing expressions that begin with `this` to use an explicit `thisArg` parameter.
- Ensure `#each` passes the iterated value as `this` reliably.
- Add a test to assert that top-level `{{ this }}` renders empty (not `[object global]`).

## Notes

- CI showed `[object global]` suggesting `this` bound to global when `thisArg` is undefined.
- Using `'use strict'` + explicit `thisArg` mapping avoids environment-specific differences.
