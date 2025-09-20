## Clarify coverage gate scope

### Summary

The documentation states the coverage hard gate applies to PRs targeting `a5c/main`. In practice, when `vars.REQUIRE_COVERAGE` is set to `true`, the gate executes on all PR workflows configured for branches `[a5c/main, main]` (`pr-tests.yml`, `tests.yml`, `quick-checks.yml`).

### Why it matters

To prevent confusion, contributors and maintainers should understand that enabling `REQUIRE_COVERAGE` gates PRs to both branches unless workflows are further constrained by base branch.

### Suggested doc tweak (non‑blocking)

- In `CONTRIBUTING.md > Coverage Gate Policy`, add a note: "When `REQUIRE_COVERAGE` is enabled at the repository level, the gate runs on all PR workflows targeting the branches they trigger for (currently `a5c/main` and `main`)."

### References

- `.github/workflows/pr-tests.yml` (on.pull_request.branches: `[a5c/main, main]`)
- `.github/workflows/tests.yml` (gate `if: github.event_name == 'pull_request' && vars.REQUIRE_COVERAGE == 'true'`)
- `.github/workflows/quick-checks.yml` (on.pull_request.branches: `[a5c/main, main]`)
