Title: Add unit tests for repository_dispatch coverage

Category: tests
Priority: medium priority

Context

- Branch: a5c/docs+fixes/audit-1023-20250919T224210Z (PR #1045)

Findings

- `repository_dispatch` added to NE `type` enum and enrich fallback mapping.
- No explicit unit tests found exercising `repository_dispatch` normalization/enrichment paths.

Recommendation

- Add tests that:
  - Normalize a minimal repository_dispatch payload → NE.type === "repository_dispatch".
  - Enrich fallback resolves `client_payload` and repo inference as documented.
  - Schema validation passes for such events.

Notes

- Strengthens guarantees for future refactors around emit/dispatch flows.
