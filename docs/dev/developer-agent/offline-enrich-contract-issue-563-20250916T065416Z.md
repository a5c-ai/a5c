[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Offline GitHub enrichment contract — issue #563

Scope: Document offline vs online enrichment behavior; add a unit test asserting absence (or stub) of `enriched.github` when `--use-github` is not provided. Align README and CLI docs with examples.

Plan:

- Baseline tests and scan code paths: `src/enrich.ts`, `src/cli.ts`
- Update README and docs/cli reference with offline vs online examples
- Add a minimal test asserting offline behavior shape
- Open PR linked to #563

Notes:

- Current implementation in `src/enrich.ts` sets `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }` when offline (no `--use-github`).
- CLI guard in `src/cli.ts` exits 3 when `--use-github` without token.
- Documentation presently mentions `reason: 'github_enrich_disabled'` in some places; align to `flag:not_set` for consistency.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
