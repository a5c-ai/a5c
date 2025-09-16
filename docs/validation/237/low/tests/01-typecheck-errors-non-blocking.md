# Typecheck errors under Vitest context (non-blocking)

- Scope: `tsc --noEmit -p tsconfig.json` reports several errors in test files (e.g., `tests/enrich.basic.test.ts`, `tests/composed.rules.test.ts`) when run standalone because Vitest types/globals are not included in the TypeScript program during `typecheck`. CI uses `vitest` runner which compiles with its own TS config and tests pass.
- Impact: Non-blocking for this PR. Our `npm test` pipeline is green. Aligning `tsconfig.json` or adding `vitest` types would eliminate these false positives during `typecheck`.

## Suggestions

- Add `"types": ["vitest/globals"]` to `tsconfig.json` or a `tsconfig.test.json` referenced via `tsconfig.json"references"` for tests.
- Alternatively, exclude tests from the default `typecheck` script and add a separate `typecheck:tests` that includes Vitest types.

Rationale: Preserve fast feedback while avoiding friction from non-actionable errors unrelated to runtime behavior.
