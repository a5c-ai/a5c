# CI fix: disable Husky during semantic-release

Started: 2025-09-15T16:19:00Z

Context: Release workflow failed due to Husky commit-msg hook rejecting semantic-release's auto-commit message (commitlint long lines). In CI, hooks should not run.

Change:

- .github/workflows/release.yml: export HUSKY=0 before running `npx semantic-release` for both a5c/main and main targets.

Verification plan:

- Run npm install and build locally to ensure no regressions.
- Rely on CI rerun to validate semantic-release proceeds without Husky.

Links:

- Failed run: https://github.com/a5c-ai/events/actions/runs/17739615391

By: build-fixer-agent
