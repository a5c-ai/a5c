### [Low] Tests - Cleanup unused ESLint disable directives

Files:
- `tests/ne.schema.compile.test.ts`: Unused `eslint-disable` for `@typescript-eslint/ban-ts-comment`.
- `tests/normalize.test.ts`: Unused `eslint-disable` for `no-console`.

Suggested fix:
- Remove unused disable comments to keep lint accurate.

Context: non-blocking hygiene discovered during PR #211 validation.

