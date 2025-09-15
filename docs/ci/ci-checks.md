# CI Checks and Gates

## PR (targeting a5c/main or main)
- Lint (eslint) — fast style check
- Quick Checks — Node 20, typecheck and vitest unit tests with coverage

These checks are intended to complete under ~5 minutes and are required for merge (configure in branch protection).

## Push (a5c/main and main)
- Build — full build on primary branches
- Tests — full test suite, CLI smoke tests, and coverage artifact upload
- Release — semantic-release and publish (on a5c/main prerelease, main stable)
- Deploy — deploy from release/* branches as configured

## Agent Routing
The a5c agent workflow listens to failures of: Build, Deploy, Packages Npx Test, Lint, Tests, Quick Checks, and may open issues/PRs to remediate.

## Notes
- Workflows use `npm ci` with caching for speed.
- Coverage artifacts are uploaded to aid debugging on failures.
- Node 20 is the baseline for PR checks; Node 22 is used where appropriate in release.

