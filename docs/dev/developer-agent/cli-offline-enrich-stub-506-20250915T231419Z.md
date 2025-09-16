[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Docs: Clarify offline enrichment stub in CLI reference (issue #506)

## Context

- Issue: #506
- Goal: Align CLI docs with implemented behavior and tests for GitHub enrichment offline/disabled scenarios.

## Plan

1. Update `docs/cli/reference.md` to replace `flag:not_set` with the unified offline stub: `{ provider: 'github', partial: true, reason: 'github_enrich_disabled' }`.
2. Document `--use-github` without token path: `{ provider: 'github', skipped: true, reason: 'token:missing' }` and exit code 3.
3. Add compact JSON examples + links to specs §5.1 and tests.

## Notes

- README already states the correct behavior; syncing CLI reference avoids confusion.
- Tests referencing this shape:
  - `tests/enrich.basic.test.ts`
  - Goldens under `tests/fixtures/goldens/*.enrich.json`
