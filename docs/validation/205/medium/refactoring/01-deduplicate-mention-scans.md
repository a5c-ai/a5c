# [Validator] Refactoring - Duplicate mention scanning logic in enrich.ts

### Summary

`src/enrich.ts` contains two separate blocks that scan changed files for mentions in code comments. This leads to duplicate work and increases maintenance cost.

### Details

- First block (around initial mentions scan) synthesizes content from patches and calls `scanMentionsInCodeComments`.
- Later block attempts GitHub API fetch and calls `scanCodeCommentsForMentions` again.
- Both operate on similar inputs (`githubEnrichment.pr.files` / `.push.files`) with overlapping purpose.

### Recommendation

- Consolidate into a single pathway with capability flags:
  - Prefer patch-based scan when available (fast, bounded)
  - Fallback to API-based content fetch when patches absent and token available
- Extract into a dedicated helper to centralize options (size caps, languages) and reduce code duplication.

### Priority

medium priority

### Affected Files

- `src/enrich.ts`

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)
