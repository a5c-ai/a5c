# Lint Warnings to Tidy

Priority: low priority
Category: refactoring

A few lint warnings exist (unused vars and unused eslint-disable directives). Non-blocking, but easy to tidy.

Examples:

- `src/codeComments.ts:125` – `_` unused
- `tests/ne.schema.compile.test.ts:13` – unused eslint-disable
- `tests/normalize.schema.test.ts:5` – `read` unused
- `tests/normalize.test.ts:43` – unused eslint-disable

Suggested action: run `eslint --fix` and prune unused disables.
