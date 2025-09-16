# Dev Log — Backend normalize() + enrich() (Issues #75, #76)

## Context

- Align normalize() to NE schema per docs/specs/ne.schema.json and docs/producer/github-adapter.md.
- Wire enrich() to GitHub enrichment (`src/enrichGithubEvent.js`) and mentions extraction.

## Plan

- Implement normalization mapping for workflow_run, pull_request, push, issue_comment.
- Preserve labels and provenance.source; extract repo, actor, ref.
- Add enrich: mentions from payload texts; optional GitHub API enrichment via flag.
- Add tests validating schema conformance (Ajv) and enrichment behavior.

## Notes

- No network by default; GitHub enrichment gated by flag/env token.
- Keep changes minimal and follow project style.
