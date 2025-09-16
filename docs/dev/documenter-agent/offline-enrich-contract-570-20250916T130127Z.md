# Doc Work Log: Finalize offline GitHub enrichment contract (issue #570)

## Goal

Unify offline `enriched.github` contract in docs to match implementation:

- Offline (no `--use-github`): `{ provider: 'github', partial: true, reason: 'flag:not_set' }`.
- `--use-github` without token: CLI exits code `3` (provider/network error).

## Plan

1. Confirm implementation in `src/enrich.ts`.
2. Update `docs/cli/reference.md` to remove conflicting `github_enrich_disabled` mention and lock to `flag:not_set`.
3. Ensure README matches; adjust text and example block.
4. Run tests.
5. Open PR linked to #570.

## Findings

- `src/enrich.ts` offline branch sets `reason: 'flag:not_set'`.
- Tests already assert offline `flag:not_set` and CLI exit code 3 without token.
- `docs/cli/reference.md` contains both `flag:not_set` and `github_enrich_disabled` — conflict to resolve.
- README shows `flag:not_set` (consistent).

## Next

Proceed with docs edits and tests run.

By: documenter-agent(https://app.a5c.ai/a5c/agents/development/documenter-agent)
