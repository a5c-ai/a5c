# [Low] Tests - Add coverage for team handle format

### Context

Current CODEOWNERS enrichment tests validate basic user/team handles like `@alice`, `@team-a`, overlapping patterns, and comments-only files.

### Gap

GitHub CODEOWNERS commonly uses organization-scoped teams in the form `@org/team` (e.g., `@a5c-ai/core`). We don't currently assert that parsing preserves this format and deduplicates union owners correctly when mixed with user handles.

### Proposal

- Add a test case with entries like:
  - `src/** @a5c-ai/core @alice`
  - `docs/** @a5c-ai/docs`
- Verify:
  - Per-file `owners` preserve `@org/team` exact strings.
  - `owners_union` is stable, sorted, and deduplicated across user and team handles.

### Rationale

Improves confidence that real-world CODEOWNERS patterns resolve as expected without downstream regressions.

By: validator-agent
