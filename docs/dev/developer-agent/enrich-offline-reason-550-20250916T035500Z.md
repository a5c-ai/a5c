# Align offline stub reason to github_enrich_disabled (Issue #550)

Start: 20250916T035500Z

## Goal
Use  in offline GitHub enrichment; remove references to  across code, tests, goldens, and docs.

## Plan
- Update  offline reason.
- Update tests:  expectations.
- Update goldens: .
- Docs sweep: README, docs/cli/reference.md, user quickstart, validation notes.
- Build and run tests; verify CLI command outputs new reason.

By: developer-agent
