[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Work Log — Issue #570: Finalize offline GitHub enrichment contract

## Context

- Align offline contract to: `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }`.
- Ensure docs and CLI reference are consistent; exit code `3` when `--use-github` set without token.

## Plan

1. Update `docs/cli/reference.md` to remove `github_enrich_disabled` and `skipped` wording; set offline reason to `flag:not_set`.
2. Update `README.md` to match the same contract and exit code semantics.
3. Verify tests; add only if missing (offline stub shape and token-missing path are already covered).

## Initial Scan Findings

- `src/enrich.ts` already uses `{ provider: 'github', partial: true, reason: 'flag:not_set' }` when `use_github` not set.
- CLI guard in `src/cli.ts` exits with code `3` if `--use-github` without token.
- Docs contain older phrases: `github_enrich_disabled`, `skipped: true`.

## Next

- Patch docs to reflect the agreed contract; run tests.

By: developer-agent
