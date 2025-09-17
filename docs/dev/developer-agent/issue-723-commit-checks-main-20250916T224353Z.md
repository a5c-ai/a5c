# Issue 723: Run Conventional Commit checks on main PRs

- Context: commit hygiene workflows only targeted `a5c/main` for PRs.
- Goal: include `main` so production branch also enforces conventions.

## Plan

1. Update `commitlint.yml` and `commit-hygiene.yml` PR branch filters to `[a5c/main, main]`.
2. Ensure `a5c.yml` workflow_run includes `Commitlint` if missing.
3. Update docs to state CI runs on both branches.
4. Validate with `actionlint` locally.

## Work Log

- [init] created branch and this doc.
