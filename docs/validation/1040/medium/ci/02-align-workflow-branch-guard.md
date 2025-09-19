## Align workflow branch guard with stated policy

### Summary

Docs define the policy scope as PRs into `a5c/main`. Workflows currently gate based on `vars.REQUIRE_COVERAGE` without filtering by base branch (besides the workflow-level `on.pull_request.branches: [a5c/main, main]`). This means enabling the repo variable will also gate PRs into `main`.

### Recommendation (non‑blocking)

- Option A (preferred): Update coverage-gate steps to include a base-branch check, e.g.: `if: ${{ github.base_ref == 'a5c/main' && vars.REQUIRE_COVERAGE == 'true' }}` (or `github.event.pull_request.base.ref`).
- Option B: Keep current behavior and explicitly state in docs that enabling `REQUIRE_COVERAGE` gates both `a5c/main` and `main` PRs, reflecting the workflows' `on.pull_request.branches`.

### References

- `.github/workflows/tests.yml` (hard gate step)
- `.github/workflows/pr-tests.yml` (hard gate step)
- `.github/workflows/quick-checks.yml` (hard gate step)
