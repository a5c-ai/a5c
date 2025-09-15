# Remove redundant PR vitest workflow

Category: tooling
Priority: low

Summary

- `Quick Checks` already runs lint, typecheck, and vitest for PRs. The separate `.github/workflows/pr-tests.yml` duplicated the unit test step for the same PR events.

Why it matters

- Duplicate PR jobs add CI time and noise without additional signal. Consolidating reduces queue time and keeps required checks simple.

Recommendation

- Keep `.github/workflows/quick-checks.yml` as the single PR check for lint + typecheck + tests.
- Ensure `.github/workflows/tests.yml` is push-only for `a5c/main` and `main` as the heavier gate.

Notes

- I prepared a minimal patch on the PR branch removing `pr-tests.yml` and aligning docs (`docs/ci/ci-checks.md`) to reflect push-only `Tests`:
  - Commit: 9c8809d (branch `chore/ci-fast-pr-checks-304`)
- Since PR #354 is already merged, please port this cleanup in a small follow-up PR targeting `a5c/main`.
