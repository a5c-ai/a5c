# Fix: include_patch not forwarded (Issue #133)

## Plan
- Reproduce failing tests locally
- Apply one-line fix in `src/enrich.ts`
- Re-run tests
- Open PR to `a5c/main`

## Context
`src/enrich.ts` computes `includePatch` but does not forward it to `enrichGithubEvent`, causing patches to be omitted regardless of flag setting.

## Results
- Applied one-line fix to pass `includePatch` to `enrichGithubEvent`.
- Verified locally: `npm test` reports 43/43 passing.
- Opened PR: https://github.com/a5c-ai/events/pull/135
