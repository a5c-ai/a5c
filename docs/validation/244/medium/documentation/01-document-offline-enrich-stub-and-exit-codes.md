# [Validator] [Documentation] - Document offline enrich stub shape and exit codes

## Context

PR #244 standardized offline enrichment behavior and CLI exit codes.

## Gaps

- README/CLI docs do not explicitly document:
  - Offline stub shape: `enriched.github = { provider: 'github', skipped: true, reason: 'flag:not_set' }`
  - `--use-github` without token: `{ skipped: true, reason: 'token:missing' }`
  - Exit codes: normalize missing `--in` (2), enrich token-missing (3), offline success (0), etc.

## Proposal

- Update README and CLI help to include the offline/flag behaviors and exit codes table.
- Add short rationale on include_patch default=false and how to enable.

## Priority

medium priority
