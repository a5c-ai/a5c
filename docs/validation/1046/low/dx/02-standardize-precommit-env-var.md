# [Validator] [DX] Standardize pre-commit env var naming

## Context

Both `A5C_PRECOMMIT_GITLEAKS` and `PRECOMMIT_GITLEAKS` are supported. Dual names can confuse contributors and CI docs.

## Recommendation

- Standardize on `A5C_PRECOMMIT_GITLEAKS` in docs and scripts.
- Keep `PRECOMMIT_GITLEAKS` as a backward-compatible alias for now, but mark as deprecated in docs.

## Priority

low
