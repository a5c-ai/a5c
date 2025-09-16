# Issue #575 – NE schema ref.type enumeration

## Context

Issue: https://github.com/a5c-ai/events/issues/575

## Initial analysis

- Schema already enumerates ref.type including 'pr' (docs/specs/ne.schema.json).
- Zod schema and provider mapping align; tests assert 'pr' for PRs.

## Plan

- No schema change now. Await product decision whether to remove 'pr' (breaking).
- If keeping as-is, close issue as already satisfied.
