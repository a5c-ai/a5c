# Issue #664 - Align offline GitHub enrichment reason to 'flag:not_set'

## Plan

- Verify runtime/tests vs docs
- Update docs to match `flag:not_set`
- Run tests
- Open PR targeting `a5c/main` (fixes #664)

## Context

- Runtime: `src/enrich.ts` already sets `reason: 'flag:not_set'` for offline.
- Tests: expect `flag:not_set`.
- Docs: `docs/cli/reference.md` still mentions `github_enrich_disabled` in one spot.
