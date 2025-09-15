# Align NE type for GitHub Issues (singular)

Issue: https://github.com/a5c-ai/events/issues/388

## Plan

- Update `src/providers/github/map.ts` `detectTypeAndId()` to return `type: "issue"` when `payload.issue` exists.
- Add normalization test covering Issues payload → expects `type: "issue"` and NE schema validation.
- Run full test suite and adjust if needed.

## Rationale

The NE schema (`docs/specs/ne.schema.json`) enumerates `"issue"` (singular). Current mapper returns `"issues"`, breaking validation and downstream assumptions.

## Notes

- Confirmed no other place uses `"issues"` literal besides the mapper.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
