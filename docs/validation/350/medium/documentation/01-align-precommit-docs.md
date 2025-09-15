# [Medium] Align docs with unified pre-commit script

`docs/dev/precommit-hooks.md` mentions pre-commit uses lint-staged. The new
unified `scripts/precommit.sh` runs lint, typecheck, and vitest instead.

## Recommendation
- Update `docs/dev/precommit-hooks.md` to reference `scripts/precommit.sh` and
  describe its checks (filename guard, whitespace/EOF, ESLint, TS typecheck,
  Vitest related or minimal run).
- Optionally keep a short note about lint-staged if it is still planned for
  staged-only lint/format, but ensure the primary path reflects the new script.

## Context
- Files: `docs/dev/precommit-hooks.md`, `scripts/precommit.sh`
- PR: #350 (`chore/precommit-hardening-303`)

## Priority
- medium priority — non-blocking for this PR.

