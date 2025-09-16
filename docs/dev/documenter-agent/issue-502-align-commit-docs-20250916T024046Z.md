# Align commit docs with actual hooks (Issue #502)

## Context

- commit-msg uses commitlint via .husky/commit-msg
- pre-commit delegates to scripts/precommit.sh with lint-staged
- pre-push runs typecheck + related tests

## Planned updates

- CONTRIBUTING.md: replace commit-verify.ts mention with commitlint; add lint-staged and skip flags
- docs/dev/precommit-hooks.md: enumerate skip envs and checks; show lint-staged patterns from package.json
- docs/contributing/git-commits.md: link to commitlint.config.cjs; clarify local validation
- README.md: one-line link to both docs

## References

- .husky/commit-msg, .husky/pre-commit, .husky/pre-push
- scripts/precommit.sh, scripts/prepush-related.js
- package.json (lint-staged), commitlint.config.cjs

## Timestamps

- Start: 20250916T024046Z
