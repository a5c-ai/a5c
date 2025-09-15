# [Validator] [Refactoring] - Deduplicate mention scans in handleEnrich

## Summary

`src/enrich.ts` contains multiple, overlapping code paths that scan changed files for code-comment mentions:

- Patch-synthesized content scan via `scanMentionsInCodeComments` (around lines ~200–240)
- GitHub API content scan via `scanCodeCommentsForMentions` (around lines ~288–360)
- A second patch-based scan using `scanPatchForCodeCommentMentions` (around lines ~383–420)

This duplication increases maintenance cost and risks inconsistent filtering behavior.

## Impact

- Harder to reason about which path runs and when
- Divergent filtering semantics (language/extension handling, size caps)
- Potential double-counting across paths if not carefully deduped upstream

## Recommendation

- Consolidate to a single scanning flow:
  1.  Prefer patch-based synthesis when `files[].patch` exists.
  2.  Fallback to API content retrieval only when patches are absent and token/octokit is available.
  3.  Apply identical filters (size, language) and a single dedupe step across both sources.
- Extract a helper to perform the scan given `(filename, content, options)` to avoid logic drift.

## Acceptance Criteria

- One scanning implementation entrypoint with shared options
- Shared normalization/dedupe to prevent duplicates
- Tests updated to cover both patch-present and API-fallback paths

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
