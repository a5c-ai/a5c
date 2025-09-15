# Issue #251 – Include legacy .js tests in Vitest

## Plan

- Update `vitest.config.ts` to include `.js` tests under `tests/` and `test/`.
- Keep TS-first coverage includes for `src/**/*.ts`.
- Run `npm install` and `npm test` to verify execution and coverage.
- Open PR linking to issue #251.

## Rationale

Minimal config change avoids noisy migrations and preserves authorship of existing JS tests. Vitest supports JS test files alongside TS.
