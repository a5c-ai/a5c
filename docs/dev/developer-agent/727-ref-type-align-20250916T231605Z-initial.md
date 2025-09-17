# Worklog: Align spec enum for ref.type (Issue #727)

## Context

- Issue: https://github.com/a5c-ai/events/issues/727
- Goal: Remove `pr` from `ref.type` enum in specs and clarify PR mapping semantics (type `branch` + base/head).
- Schema: `docs/specs/ne.schema.json` already enumerates `branch|tag|unknown`.
- Implementation: `src/providers/github/map.ts` maps PRs to branch and sets base/head.

## Plan

1. Update `docs/specs/README.md` §3 to show `branch|tag|unknown` and keep PR semantics note.
2. Sweep for stale mentions in primary specs/examples; adjust if misleading.
3. Validate example output with `npm run validate:examples`.

## Notes

- No code changes expected; docs only.

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
