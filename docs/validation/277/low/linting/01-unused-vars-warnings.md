# Lint: unused vars warnings

Non-blocking lint warnings detected on PR #277 (branch `a5c/main`). These do not fail CI but should be cleaned up in a follow-up for code hygiene.

Warnings:

- `src/codeComments.ts:125:14` — `_` is defined but never used
- `src/commands/normalize.ts:14:12` — `e` is defined but never used
- `tests/cli.validate.test.ts:22:11` — `sample` is assigned a value but never used
- `tests/normalize.schema.test.ts:5:10` — `read` is defined but never used

Notes:

- Kept as documentation only; no behavior impact. Consider removing unused variables or prefixing with `_` where intentional.
