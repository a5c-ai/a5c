[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Fix: Align offline GitHub enrichment shape (issue #245)

- Branch: fix/enrich-offline-shape-issue-245
- Goal: Unify programmatic `handleEnrich` offline output to match README and CLI:
  - Use `{ provider: 'github', partial: true, reason: 'github_enrich_disabled' }` when `--use-github` is not set.
  - Keep `{ provider: 'github', skipped: true, reason: 'token:missing' }` when `--use-github` is set but token missing (programmatic API), as tests assert this.
- Update tests to remove contradictory expectations and update golden fixtures.

## Plan

1. Update `src/enrich.ts` offline branch to `partial/github_enrich_disabled`.
2. Update `tests/enrich.basic.test.ts` to expect the unified shape.
3. Update goldens under `tests/fixtures/goldens/*.enrich.json` accordingly.
4. Run tests locally and adjust if needed.

## Notes

- CLI path (`src/commands/enrich.ts`) already uses `partial/github_enrich_disabled` for offline mode and `github_token_missing` when token is missing.
- README documents the `partial/github_enrich_disabled` offline behavior.
