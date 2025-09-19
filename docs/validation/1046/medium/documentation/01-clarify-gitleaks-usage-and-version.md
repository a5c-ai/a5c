# [Validator] [Documentation] Clarify local Gitleaks usage and version

## Context

Pre-commit docs now recommend `gitleaks protect --staged -v` (correct). Some developers may still have older Gitleaks versions or expect `--no-git` from `detect` usage.

## Recommendation

- Add a short note in `docs/dev/precommit-hooks.md` explaining:
  - `protect --staged` scans the staged index (no `--no-git` flag).
  - Minimum recommended Gitleaks version (v8+) and a link to official docs.
  - How to install/upgrade locally (brew/scoop/curl script) and verify with `gitleaks version`.

## Priority

medium
