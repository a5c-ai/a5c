# [Validator] [Tests] - Add provider field assertion in offline stub

## Context

Tests assert `skipped` and `reason` for offline and token-missing paths, but do not assert that `provider: 'github'` is present on the stub.

## Proposal

- Extend tests to assert `gh.provider === 'github'` for both offline and token-missing cases.

## Priority

low priority
