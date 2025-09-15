# Build Fixer Worklog — CI Release failure

- Context: Release workflow failed on a5c/main due to Husky commit-msg hook blocking `@semantic-release/git` commit.
- Failed run: https://github.com/a5c-ai/events/actions/runs/17740302952
- Root cause: commitlint strict rules (body/footer line length, footer blank) enforced via Husky in CI; semantic-release creates long conventional commits.

## Plan
- Disable Husky during semantic-release in CI using `HUSKY=0` env on release steps only.
- Keep local commit validation unchanged for contributors.
- Verify by re-running Release once merged into a5c/main.

## Notes
- Alternative (not chosen): relax commitlint rules for body/footer globally. Prefer minimal CI-scoped change.
