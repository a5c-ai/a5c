# [Validator] [Documentation] Low - Document GitHub normalization mapping

## Summary

Add a mapping table to `docs/producer/github-adapter.md` that clearly shows source GitHub payload fields and their NE counterparts for the supported events (`workflow_run`, `pull_request`, `push`, `issue_comment`).

## Rationale

A visible mapping helps maintainers and contributors quickly understand how raw inputs translate to NE fields, improving onboarding and reducing regressions.

## Scope

- Expand docs with a table per event type: id, type, occurred_at, repo, ref, actor, provenance.workflow, labels
- Note edge cases: missing `ref` on issue_comment, deriving branch from `refs/heads/*` on push, etc.

## Acceptance Criteria

- Tables present for all four supported GitHub event types
- Linked from `docs/cli/ne-schema.md` for discoverability
