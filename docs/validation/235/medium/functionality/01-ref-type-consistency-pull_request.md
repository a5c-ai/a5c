# [Validator] [Functionality] - Ref type consistency for pull_request

### Context
Provider adapter `src/providers/github/map.ts` maps `pull_request` events with `ref.type: "branch"`. The primary normalizer `src/providers/github/normalize.ts` (used by CLI and tests) emits `ref.type: "pr"` for pull requests, and tests assert this shape.

### Why it matters
- Inconsistent `ref.type` between normalizer and provider adapter can confuse downstream rules/filters relying on the NE schema enum which includes `pr` for PR refs.
- Aligning both paths prevents subtle behavior differences depending on which entry point is used.

### Suggested change
- Update `mapRef()` in `src/providers/github/map.ts` so that when `payload.pull_request` is present it sets:
  - `type: "pr"`
  - keep existing `head`, `base`, and optionally `sha` fields.
- Add/extend a unit test for provider adapter path if applicable, asserting `ref.type === "pr"` on `pull_request`.

### Priority
medium priority

### Notes
This is non-blocking for the current PR since CLI normalization path is correct and tests pass.

