# [Validator] [Documentation] - Document offline enrich stub shape and exit codes

## Context

PR #244 standardized offline enrichment behavior and CLI exit codes.

## Gaps

- README/CLI docs do not explicitly document:
  - Offline stub shape: `enriched.github = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }`
  - `--use-github` without token: CLI exits with code `3` (provider/network error); programmatic path may stub `{ skipped: true, reason: 'token:missing', partial: true }` when Octokit is injected for tests.
  - Exit codes: normalize missing `--in` (2), enrich token-missing (3), offline success (0), etc.

## Proposal

- Update README and CLI help to include the offline/flag behaviors and exit codes table.
- Add short rationale on include_patch default=false and how to enable.

## Priority

medium priority
