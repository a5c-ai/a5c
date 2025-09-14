# [Producer] Backend – Enrichment integration in CLI and flags (Issue #90)

## Plan
- Wire `handleEnrich` to use `enrichGithubEvent`
- Detect event type (PR vs push)
- Map adapter output under `enriched.github.*` and compute `has_conflicts`
- Support flags: `include_patch`, `commit_limit`, `file_limit`
- Add unit tests for PR and push samples and patch stripping
- Update README CLI reference

## Notes
- Token from `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`
- No network in unit tests — mock `enrichGithubEvent`

