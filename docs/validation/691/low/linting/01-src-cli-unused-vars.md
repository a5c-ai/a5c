## Linting: unused variables in src/cli.ts

- Severity: low priority
- Category: linting

Findings:

- `src/cli.ts`: two warnings reported by eslint:
  - line 142: `_` is defined but never used (@typescript-eslint/no-unused-vars)
  - line 191: `output` is assigned a value but never used (@typescript-eslint/no-unused-vars)

Impact:

- No functional impact; purely cosmetic. Keeping code clean avoids noise in CI and improves maintainability.

Suggested fix:

- Remove the unused identifier(s) or prefix with `_unused` if kept for future use; alternatively disable the rule locally with a targeted comment if intentional.

Context:

- Discovered during validation of PR #691. Tests pass and functionality is correct; this note documents a non‑blocking improvement.
