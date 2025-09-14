# Issue #285 — Add PR Type-Check Gate — CI

## Context
- Goal: Add a fast, standalone TypeScript type-check job that runs on PRs and must pass before merge.
- Note: Current `npm run typecheck` includes tests and fails due to Vitest globals/types and some test-only shapes. These are documented as non-blocking previously.

## Plan
- Add dedicated `tsconfig.typecheck.json` excluding tests; keep strict for `src/`.
- Update `package.json` `typecheck` to target new config (noEmit).
- Add `.github/workflows/typecheck.yml` with Node 20/22 matrix, npm cache, and step summary on failures.
- Add `Typecheck` to `.github/workflows/a5c.yml` `on.workflow_run.workflows` list for agent visibility.
- Verify locally and open PR linking to issue #285.

## Notes
- Follow-up option: add `typecheck:tests` with Vitest types for deeper static analysis of tests separately.

