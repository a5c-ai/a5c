# Task: Run Conventional Commit checks on main PRs (issue #723)

## Context

- Current: commit validation workflows only target PRs into `a5c/main`.
- Goal: Also run for PRs into `main`.

## Plan

1. Update `.github/workflows/commitlint.yml` `on.pull_request.branches` to `[a5c/main, main]`.
2. Update `.github/workflows/commit-hygiene.yml` similarly.
3. Lint with `actionlint` and push.
4. Verify CI picks up on PR to `a5c/main` (project standard) and that PRs to `main` would also trigger checks as requested.

## Notes

- No behavior change to rules; only trigger branches.
- Keep names stable for `workflow_run` linkages.
