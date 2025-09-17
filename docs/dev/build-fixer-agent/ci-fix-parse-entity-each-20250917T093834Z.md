# CI Fix: export parseGithubEntity + each this binding

- Context: Failed run https://github.com/a5c-ai/events/actions/runs/17793071385
- Failures:
  - `fn.parseGithubEntity is not a function` in test/emit.labels.test.ts
  - generateContext each block didn’t bind `this`, causing list rendering mismatch

## Plan

- Export `parseGithubEntity` from src/emit.ts
- Ensure `{{#each}}` binds `this` for array items in src/generateContext.ts
- Run unit tests locally
- Open PR with details
