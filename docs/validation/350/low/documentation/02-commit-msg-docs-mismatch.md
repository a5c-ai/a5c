# [Validator] Documentation - Commit message validation method mismatch

Priority: low priority
Category: documentation

`CONTRIBUTING.md` references `scripts/commit-verify.ts` for commit message validation, but the actual hook is `.husky/commit-msg` using `commitlint` via `npx`.

Suggested fix: Update docs to reference the commitlint-based flow and remove mentions of `scripts/commit-verify.ts` (unless that script exists and is intended to be used).

Files: `CONTRIBUTING.md`, `.husky/commit-msg`
