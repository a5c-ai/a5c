# Unify GitHub normalization — remove unused normalizeGithub

## Context

- Issue: #860 — Remove or unify legacy GitHub normalizer to prevent spec drift.
- Current: CLI uses `mapToNE` in `src/providers/github/map.ts`; a legacy normalizer appears unused and has differing heuristics.

## Plan

- Confirm unused status for `normalizeGithub` by repo search.
- Remove legacy normalizer implementation to enforce a single canonical path.
- Update docs that reference the old path to point to `mapToNE` / `GitHubProvider.normalize`.
- Add unit test to assert `cmdNormalize` calls `mapToNE`.

## Notes

- Keep changes minimal; avoid touching unrelated logic.
- Ensure tests pass.
