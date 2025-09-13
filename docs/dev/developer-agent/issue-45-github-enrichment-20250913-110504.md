# Issue #45 – GitHub enrichment: commits/diffs/PR state/owners

## Plan
- Scaffold Node.js package with Octokit
- Implement enrichGithubEvent for PR/push
- Add unit tests (mock Octokit)
- Wire minimal CI via existing a5c workflow (tests via npm)

## Notes
- Graceful handling for missing perms
- Configurable limits for commits/files
\n## Results
- Implemented enrichment module + tests
- Opened PR: https://github.com/a5c-ai/events/pull/65
