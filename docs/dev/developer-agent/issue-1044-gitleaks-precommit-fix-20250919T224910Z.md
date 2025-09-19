# Dev Log - Issue #1044 - Fix invalid flag in Gitleaks pre-commit command

## Context
Validator flagged that `--no-git` is invalid with `gitleaks protect` in the optional local pre-commit scan.

## Plan
- scripts/precommit.sh: remove `--no-git` from `gitleaks protect --staged -v`.
- docs/dev/precommit-hooks.md: update the example and notes.
- Sanity check: search for any other mentions of `--no-git` tied to `protect`.

## Notes
CI workflow remains the source of truth and is unchanged.

