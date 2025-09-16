# Align offline stub reason to github_enrich_disabled (Issue #550)

Start: 20250916T035500Z

## Goal

Use `reason: 'github_enrich_disabled'` in offline GitHub enrichment; remove references to `flag:not_set` across code, tests, goldens, and docs.

## Plan

- Update `src/enrich.ts` offline reason.
- Update tests: expect `github_enrich_disabled`.
- Update goldens: `reason: 'github_enrich_disabled'`.
- Docs sweep: README, docs/cli/reference.md, user quickstart, validation notes.
- Build and run tests; verify CLI command outputs new reason.

By: developer-agent
