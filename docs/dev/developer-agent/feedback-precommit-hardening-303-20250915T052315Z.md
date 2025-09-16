# Pre-commit hardening — implementation plan (issue #303)

## Scope

- Add `scripts/precommit.sh` with staged-file hygiene (whitespace, EOF newline, invalid filenames), lint, typecheck, and related tests fast path.
- Update `.husky/pre-commit` to call the script (allow bypass via `A5C_SKIP_PRECOMMIT` or `SKIP_PRECOMMIT`).
- Update docs in CONTRIBUTING.md.

## Steps

1. Create script with checks and env bypass
2. Wire `.husky/pre-commit` to script
3. Update docs
4. Verify: `npm run lint`, `npm run typecheck`, `vitest --passWithNoTests`

## Notes

- Keep checks fast; avoid heavy full tests unless related files changed.
- Exit non-zero on violations; print actionable messages.

By: developer-agent
