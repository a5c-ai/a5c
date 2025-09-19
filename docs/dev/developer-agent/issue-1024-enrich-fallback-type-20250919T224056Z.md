# Issue 1024 – Fix NE type mismatch in enrich fallback

- File: `src/enrich.ts`
- Problem: fallback NE `type` emits `"issues"` (plural) and `"repository_dispatch"` which are not allowed by NE schema.
- Plan:
  - Map issues to `"issue"` (singular)
  - Replace `"repository_dispatch"` fallback with a supported NE type (`"commit"`)
  - Add tests for `issue` and `issue_comment` fallback paths
  - Validate with `docs/specs/ne.schema.json`
