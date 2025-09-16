# [Validator] [Functionality] - Ref type consistency for pull_request

### Context

Provider adapter `src/providers/github/map.ts` maps `pull_request` events with `ref.type: "branch"`. The primary normalizer aligns to the same semantics — `ref.type: "branch"` for pull requests.

### Why it matters

- Inconsistent `ref.type` between normalizer and provider adapter previously caused confusion. NE schema no longer includes `"pr"` in the `ref.type` enum. Aligning both paths prevents subtle behavior differences depending on which entry point is used.

### Suggested change

- Ensure `mapRef()` in `src/providers/github/map.ts` sets `type: "branch"` and preserves `head`/`base` from the PR payload.
- Tests should assert `ref.type === "branch"` for `pull_request` events.

### Priority

medium priority

### Notes

This is non-blocking for the current PR since CLI normalization path is correct and tests pass.
