# Required Checks and Triggers

See also: [Branch Protection: Required Status Checks (a5c/main)](./branch-protection-required-checks.md)

## Pull Requests (targeting a5c/main or main)

- Lint (eslint)
- Typecheck (tsc noEmit)
- Unit Tests (vitest) – quick mode with coverage and dot reporter

Constraints:

- Each job sets a hard timeout to keep total under ~5 minutes.
- Node 20 baseline; optional matrix for Node 22 on typecheck only.

## Push (a5c/main, main)

- Build (full build)
- Tests (full test suite)
- Release (semantic-release) – as configured in release.yml

## Artifacts

- On PR test failures, upload coverage lcov for diagnostics.
