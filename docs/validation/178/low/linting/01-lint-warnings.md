# Lint Warnings (Non-blocking)

Scope: PR #178 — low priority lint cleanups to consider.

- src/codeComments.ts: '_' is defined but never used (line ~125)
- tests/ne.schema.compile.test.ts: Unused eslint-disable directive for '@typescript-eslint/ban-ts-comment'
- tests/normalize.schema.test.ts: 'read' is defined but never used
- tests/normalize.test.ts: Unused eslint-disable directive for 'no-console'

Recommendation: remove unused variables/directives or adjust rules. These do not block merging.

