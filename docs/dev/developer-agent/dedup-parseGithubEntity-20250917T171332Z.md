# Refactor: Deduplicate parseGithubEntity

## Summary

Duplicate implementations of `parseGithubEntity` exist in:

- `src/emit.ts` (exported)
- `src/reactor.ts` (internal)

This refactor extracts a single shared helper and updates call sites.

## Plan

1. Add shared util `src/utils/githubEntity.ts`:
   - `parseGithubEntity(url)` → strict: owner/repo/number (keeps emit.ts behavior)
   - `parseGithubOwnerRepo(url)` → lenient: owner/repo from repo or entity URLs
2. Update `src/emit.ts` to import and re-export `parseGithubEntity` (no behavior change)
3. Update `src/reactor.ts` to import helpers and adjust usage (use `parseGithubOwnerRepo` when number may be absent)
4. Add unit tests covering issues, PRs, API-style URLs, and invalid inputs
5. Run `./scripts/test.sh` and fix any regressions

## Notes

- Preserve current behavior of `parseGithubEntity` exported from `src/emit.ts`.
- Avoid breaking `inferRepoFromNE` which parses repo `html_url` (no number).

## Progress

- [x] Scaffolding util and imports
- [x] Tests added

- [x] All tests passing
