### [Low] Linting — Remove unused eslint-disable directives

Context: During validation, `npm run lint` surfaced warnings for unused `eslint-disable` directives:

- `tests/ne.schema.compile.test.ts`: Unused disable for `@typescript-eslint/ban-ts-comment`.
- `tests/normalize.test.ts`: Unused disable for `no-console`.

Why: Unused disables can hide real issues later and add noise to CI.

Suggested fix:

- Remove the unused `eslint-disable` comments in the two files above.

Notes:

- Not blocking; warnings only. Address when touching these files next.
