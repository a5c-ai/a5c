### [Low] Linting - Unused variable in codeComments

- File: `src/codeComments.ts`
- Line: around 125
- Issue: `_` is defined but never used (`@typescript-eslint/no-unused-vars`).

Suggested fix:

- Remove the unused variable or prefix with `_unused` only if intentional.

Rationale:

- Keeps lint clean and prevents drift; non-blocking as it does not affect runtime.

Context: captured during validator lint run for PR #211.
