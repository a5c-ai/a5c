# [Validator] Refactoring - Duplicate pulls.get

### Summary
The code calls `octokit.pulls.get` twice (`prRes` and `prCheck`) for the same PR. The second call is only used to read `mergeable`, `rebaseable`, and `mergeable_state`.

### Recommendation
- Reuse a single response or call `pulls.get` once and store required fields.
- If a re-check is desired for fresh mergeability, document intent and consider a small delay or `refresh=true` semantics (not available in v3; polling is fine but add a comment).

### Context
- File: `src/enrichGithubEvent.js`

### Priority
low priority
