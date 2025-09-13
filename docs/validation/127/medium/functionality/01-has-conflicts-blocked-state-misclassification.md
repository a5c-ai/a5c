# [Validator] Functionality - has_conflicts includes `blocked`

### Summary
`_enrichment.pr.has_conflicts` is derived from `mergeable_state` as `dirty` OR `blocked`. GitHub uses `blocked` for missing reviews or required checks, not only merge conflicts. This can misclassify PRs without conflicts as conflicting.

### Recommendation
- Limit conflicts detection to `mergeable_state === "dirty"` (and possibly `"unknown"` only when `mergeable === false` and mergeability recheck timed out), or
- Add a separate `_enrichment.pr.is_blocked` boolean for policy blocks to preserve signal.

### Context
- File: `src/enrichGithubEvent.js`
- Lines: `has_conflicts` derived from `mergeable_state`.

### Priority
medium priority
