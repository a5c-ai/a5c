# Optionally fail on actionlint findings — CI (Issue #725)

## Summary

Add opt-in strict mode for actionlint driven by `REQUIRE_ACTIONLINT`. Default remains advisory.

## Plan

- Update `scripts/ci-actionlint.sh` to read `REQUIRE_ACTIONLINT` and fail when true and issues found
- Update `.github/workflows/quick-checks.yml` to pass `${{ vars.REQUIRE_ACTIONLINT || '' }}` into the env
- Document behavior in logs (notice vs warning)

## Implementation Notes

- Maintain current binary-first, docker-fallback strategy
- Exit codes: 0 for pass or advisory; 1 when strict mode and findings

## Acceptance Criteria

- Default: advisory only (non-failing)
- With `REQUIRE_ACTIONLINT=true`: job fails on findings
- Logs clearly state the mode
