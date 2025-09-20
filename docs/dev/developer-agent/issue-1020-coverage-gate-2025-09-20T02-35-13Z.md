# Issue #1020 — Enable coverage gate for a5c/main PRs

Started: 2025-09-20T02-35-13Z

## Plan
- Confirm thresholds single-source file and align values to 60/55/60/60
- Update PR workflows to enable hard gate on base a5c/main with override via repo var
- Update CONTRIBUTING with policy and maintenance steps
- Verify locally (install, build, tests)

## Notes
- vitest config already honors REQUIRE_COVERAGE env to enforce thresholds
- Workflows have optional gate steps keyed off \'vars.REQUIRE_COVERAGE\'
