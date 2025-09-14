# [High] CI — Ensure Husky hook installation

### Summary
The repo includes a `.husky/commit-msg` hook and `scripts/commit-verify.ts`,
but `husky` is not declared as a devDependency and `package.json` lacks a
`prepare` script to install Git hooks. This means local commit validation may
not run for contributors unless they manually set up Husky.

### Recommendation
- Add `husky` as a devDependency.
- Add `"prepare": "husky install"` (merge with existing prepare via npm-run-all or inline chaining).
- Run `npx husky add .husky/commit-msg "npx -y tsx scripts/commit-verify.ts --file \"$1\" --allow-merge"` in setup scripts if needed.

### Rationale
This provides immediate, local feedback for Conventional Commits and reduces CI churn.

