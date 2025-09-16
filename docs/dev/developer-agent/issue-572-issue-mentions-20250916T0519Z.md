# Issue #572 – Scan issue title/body for mentions

## Plan

- Implement extraction for GitHub `issue.title` and `issue.body` in `src/enrich.ts` using `extractMentions` with sources `issue_title` and `issue_body`.
- Ensure dedupe across sources via a second-pass collapse on identical targets (preserve location-based entries).
- Add unit test with `issues.opened`-shaped payload containing mentions in title and body.
- Verify baseline tests; update docs (CLI reference) if gaps.

## Notes

- `MentionSource` already includes `issue_title` and `issue_body`.
- `extractor` defaults enable these sources; `dedupeMentions` exists; add cross-source collapse in `enrich.ts`.

## Progress

- Initialized branch and baseline tests passed.
- Implemented cross-source dedupe when no precise location.
- To add tests and run full suite next.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
