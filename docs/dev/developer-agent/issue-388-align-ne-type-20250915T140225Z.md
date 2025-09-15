# Align NE type for GitHub Issues: "issue" (not "issues")

## Context

- Schema at `docs/specs/ne.schema.json` enumerates `"issue"` (singular).
- `src/providers/github/map.ts` returns `type: "issues"` in `detectTypeAndId()` when `payload.issue` is present.
- Downstream validators/tools expect `issue`.

## Plan

1. Update mapping to emit `type: "issue"`.
2. Add a test to assert Issues payload normalizes with `type === "issue"` and passes schema validation.
3. Run tests and adjust any related fixtures if needed.

## Notes

- Keep changes minimal and consistent with existing code style.
- Verify no other adapters emit pluralized types.
