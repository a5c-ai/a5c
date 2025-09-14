# [High] Tests typecheck failures under tsconfig.json

Scope: PR #243 (branch: fix/cli-dedupe-emit-validate-239)

Category: tests

Summary

- Running `npm run typecheck` fails with multiple errors in `tests/**` when using `tsconfig.json`.
- Build (`tsconfig.build.json`) succeeds, confirming TS2300 duplicate identifier is resolved and publish build is healthy.

Details (captured locally)

- Examples:
  - `tests/composed.rules.test.ts: Cannot find name 'beforeAll'.`
  - Several shape/type errors in tests referring to `{}` types and `startsWith` on union types.

Recommendations

- Add Vitest typings to tests by configuring `tsconfig.json` (e.g., `types: ["vitest"]`) or per-test `/// <reference types="vitest" />`.
- Tighten test type assertions or align helper types to avoid `{}` leaks.
- If intentional, split dev typecheck configs: keep `tsconfig.json` green or add a dedicated `tsconfig.tests.json` with appropriate libs/types.

Rationale

- Keeping `typecheck` green improves DX and CI signal quality, independent of build.

Status: Non-blocking for this PR; document as tech-debt.

