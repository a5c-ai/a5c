# Issue #76 – Wire enrich() to GitHub enrichment + mentions

Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Plan

- Add `--use-github` flag to CLI and `handleEnrich`
- Integrate `enrichGithubEvent` for PR/Push when enabled
- Always run mentions extraction from available text sources
- Add unit tests for merging and mentions extraction
- Update docs (CLI reference) examples

## Notes

- Default remains offline (no network). `GITHUB_TOKEN` required when enabled.
- Respect basic caps, no large payloads unless flags expand in future.
