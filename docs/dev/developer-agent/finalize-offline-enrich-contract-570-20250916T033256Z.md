# Finalize offline GitHub enrichment contract — sync code and docs (Issue #570)

## Context

- Offline contract: `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }`
- Token-missing with `--use-github`: CLI exits with code 3. Programmatic API returns `{ provider: 'github', partial: true, reason: 'token:missing' }` if invoked directly.

## Plan

1. Update docs/cli/reference.md to reflect the finalized contract and exit codes.
2. Update README to remove stale variants (e.g., `github_enrich_disabled`, `skipped: true`).
3. Verify tests already assert offline stub and token-missing paths; add if missing.
4. Run build and tests; open PR linked to issue #570.

## Progress

- Branch created; starting doc updates.

By: developer-agent
