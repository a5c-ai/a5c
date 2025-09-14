# [Validator] Lint – Existing warnings and minor errors (non-blocking)

Category: linting
Priority: low

Context: During validation of PR #246, running `npm run lint` surfaced pre-existing lint issues unrelated to this PR's changes.

Findings:
- src/rules.ts: Unused expressions at lines around 224 and 229 (`@typescript-eslint/no-unused-expressions`).
- src/rules.ts: Prefer `const` (line ~321) – `prefer-const`.
- tests/normalize.schema.test.ts: Unused var `read` – `@typescript-eslint/no-unused-vars`.

Notes:
- These were present before PR #246 and are out-of-scope for this fix.
- Suggest a follow-up housekeeping PR to resolve and enable `eslint --max-warnings=0` in CI if desirable.

