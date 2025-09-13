# Work Log: Enforce Conventional Commits (Issue #161)

## Plan
- Add commitlint and configuration
- Wire Husky commit-msg and pre-commit
- Add lint-staged and format:check
- Move build from prepare to prepack; prepare only installs Husky
- Optional CI action for commitlint on PRs

## Context
- package.json currently has `prepare: npm run build` which triggers builds on install
- `.husky/pre-commit` exists but no commit-msg; commitlint not installed

