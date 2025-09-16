# Docs progress: issue #529

Started: Align Codecov docs with existing workflows (prefer Action)

## Plan

- README Coverage: Action default, script alternative.
- docs/ci/ci-checks.md: Coverage upload section with Action inputs.
- Cross-check workflow guards and inputs.

## Context

- Workflows already use codecov/codecov-action@v4 guarded by token.
- No scripts/coverage-upload.sh in repo; will document as optional external script path.
