# Issue #572 – Scan GitHub issue title/body for mentions

Plan:

- Update handleEnrich to extract mentions from `payload.issue.title` and `payload.issue.body`.
- Add unit test to verify `issue_title` and `issue_body` sources.
- Update CLI docs to list issue sources and example.

Implementation:

- src/enrich.ts: added extraction for `issue_title` and `issue_body`.
- tests/mentions.issue-title-body.test.ts: new test covering both sources.
- docs/cli/reference.md: enumerate issue sources; add example with issues payload.

Notes:

- Dedupe semantics preserved by extractor.dedupeMentions and code-comment scanner dedupe.
- No changes to API enrichment path; purely offline mentions extraction.
