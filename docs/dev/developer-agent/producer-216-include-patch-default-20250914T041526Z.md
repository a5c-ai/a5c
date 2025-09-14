# Producer: Flip default include_patch=false and tests (issue #216)

## Plan
- Flip default for `include_patch` to false in enrich flow
- Add unit tests ensuring:
  - default excludes patch fields in PR/push files
  - explicit `include_patch=true` preserves patch fields
- Run full test suite

## Context
- Current default is true in `src/enrich.ts`.
- `src/enrichGithubEvent.js` returns `patch` field in files.

## Work log
- [ ] Change default value in `src/enrich.ts`
- [ ] Add tests under `tests/` to assert patch visibility by flag
- [ ] Run tests and open PR

