# [Validator] [Linting] Unused variables warnings

Severity: low priority

Summary: ESLint reports 3 warnings for unused variables. These are non-blocking but should be cleaned up to keep the codebase tidy and to avoid future confusion.

Files and lines:

- src/cli.ts:142 — '\_' is defined but never used
- src/cli.ts:191 — 'output' is assigned a value but never used
- src/providers/github/map.ts:160 — 'coerceSource' is defined but never used

Suggested fixes:

- Remove unused variables or prefix with '\_' intentionally if needed.
- If placeholders are required, add a brief comment to clarify.

Context: Added during validation for PR #689.
