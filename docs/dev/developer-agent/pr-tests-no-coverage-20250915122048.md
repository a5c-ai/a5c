# CI: PR tests without coverage thresholds

## Context

Validator noted PR checks fail due to Vitest coverage thresholds (lines/statements 60% required, current ~58.97%), unrelated to the PR changes. Preferred fix: change `.github/workflows/pr-tests.yml` to run `npm run -s test` to avoid enforcing coverage on PRs; keep enforcement on push via `tests.yml`.

## Plan

- Switch to new branch from `a5c/main`.
- Install deps and verify tests locally.
- Modify `.github/workflows/pr-tests.yml` to use `npm run -s test`.
- Push branch and open PR against `a5c/main`.
- Request validator review.

## Notes

- No change to `tests.yml` (push) workflow; coverage enforcement remains there.
