# CI Fix: Skip Husky during semantic-release

## Context

Release run https://github.com/a5c-ai/events/actions/runs/17739136554 failed on `a5c/main` due to Husky commit-msg hook rejecting the auto-generated release commit by `@semantic-release/git`.

Error excerpt indicates commitlint footer-max-line-length enforcement during semantic-release's commit step.

## Change

Set `HUSKY=0` environment variable in Release workflow steps executing `npx semantic-release` (both for `a5c/main` and `main`) to disable Husky hooks in CI.

## Rationale

Husky hooks are for developer local workflows; CI release automation should not be blocked by commit hooks. Commit message conventions are enforced via other checks on PRs.

## Verification

- Local `npm ci && npm run build` passes.
- Will verify subsequent Release run succeeds.

## Links

- Failing run: https://github.com/a5c-ai/events/actions/runs/17739136554
- Commit: 014ef7bd33dd6520334161bc149ee852a1daf006
