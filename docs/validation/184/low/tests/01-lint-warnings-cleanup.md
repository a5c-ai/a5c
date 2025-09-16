# [Low] Tests/Code – Lint warnings cleanup

Minor lint warnings remain in this branch. Non‑blocking but should be cleaned up for code health.

- src/codeComments.ts: '\_' is defined but never used (@typescript-eslint/no-unused-vars)
- src/enrich.ts: 'evaluateRules' is defined but never used (@typescript-eslint/no-unused-vars)
- tests/ne.schema.compile.test.ts: Unused eslint-disable directive
- tests/normalize.schema.test.ts: 'read' is defined but never used
- tests/normalize.test.ts: Unused eslint-disable directive

Suggested fix: remove unused identifiers/imports or adjust eslint-disable placements. Run `npm run lint -- --fix` where safe.
