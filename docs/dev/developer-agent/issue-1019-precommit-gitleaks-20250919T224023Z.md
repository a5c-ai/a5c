# Work Log: Optional pre-commit Gitleaks (issue #1019)

## Context

Add optional local secret scanning using Gitleaks in `scripts/precommit.sh`, gated behind `A5C_PRECOMMIT_GITLEAKS=1` or `PRECOMMIT_GITLEAKS=1`. Update docs at `docs/dev/precommit-hooks.md`. CI remains unchanged.

## Plan

1. Update pre-commit script: env-gated `gitleaks protect --staged --no-git -v` when `gitleaks` is available.
2. Docs: add install instructions, enable/disable guidance, bypass for false positives.
3. PR: link to issue (#1019), keep CI unaffected.

## Notes

- Pre-commit must remain fast and optional. If `gitleaks` is missing or toggle is off, skip silently with a short note.
- Respect existing skip toggles: `A5C_SKIP_PRECOMMIT` / `SKIP_PRECOMMIT` / `SKIP_CHECKS`.

## Next

- Implement script + docs and open draft PR.
