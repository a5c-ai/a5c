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
  \n## Changes
- Update scripts/coverage-thresholds.json to 60/55/60/60
- Enable auto coverage gate for PRs into a5c/main via env REQUIRE_COVERAGE in pr-tests.yml and quick-checks.yml; maintainers can disable by setting repo var REQUIRE_COVERAGE='false'
- Update CONTRIBUTING.md with coverage policy and thresholds ownership
  \n## Local Verification
- npm ci, build, and tests ran successfully (coverage below new floor, as expected without gate).
