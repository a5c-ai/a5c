# Documentation Work Log — Issue #44: NE schema and GitHub adapter

## Context

- Issue: https://github.com/a5c-ai/events/issues/44
- Goal: Produce documentation for Normalized Event (NE) schema, GitHub adapter mapping, CLI usage, and tests/fixtures structure per acceptance criteria.

## Initial Plan

- Add NE JSON Schema in `docs/specs/ne.schema.json` with fields: id, provider, type, occurred_at, repo, ref, actor, payload, enriched, labels, provenance.
- Add GitHub adapter documentation in `docs/producer/github-adapter.md` covering mappings for `workflow_run`, `pull_request`, `push`, `issue_comment`.
- Add CLI docs with examples for reading payloads and validating against schema in `docs/producer/cli-normalize.md`.
- Note unit test coverage expectations and fixtures layout.

## Progress

- [ ] Draft NE schema
- [ ] GitHub adapter mapping docs
- [ ] CLI examples and validation notes
- [ ] Cross-links to specs and workflows

## Notes

- No `package.json` present; treating this task as documentation-focused for now per issue.
