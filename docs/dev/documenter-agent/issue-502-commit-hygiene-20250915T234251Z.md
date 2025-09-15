# Align commit docs with actual hooks — Issue #502

## Context

- Issue: https://github.com/a5c-ai/events/issues/502
- Goal: Single source of truth for commit policy; align docs with Husky hooks and lint-staged.

## Plan

- Update docs/contributing/git-commits.md to mention commitlint config and .husky/commit-msg
- Update docs/dev/precommit-hooks.md and CONTRIBUTING.md with lint-staged patterns and skip flags
- Add README link in Contributing section

## Notes

- commit-msg uses `npx commitlint --edit "$1"` per `.husky/commit-msg`.
- lint-staged patterns defined in package.json under `"lint-staged"`.
- Skip envs: `A5C_SKIP_PRECOMMIT`, `SKIP_PRECOMMIT`, and legacy `SKIP_CHECKS` (message currently mentions SKIP_CHECKS only).

## Work Log

- 00:00 Reviewed hooks, scripts, and docs; drafted changes.
