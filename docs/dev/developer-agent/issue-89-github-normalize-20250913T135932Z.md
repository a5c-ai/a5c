# Work Log — developer-agent — Issue #89

## Intent

Implement provider-aware normalization mapping for GitHub events to NE schema fields per docs/specs/README.md.

## Plan

- Create `src/providers/github/normalize.ts` with mapper for workflow_run, pull_request, push, issue_comment.
- Update `src/normalize.ts` to dispatch to provider-aware normalizer, preserve labels/provenance.
- Add unit tests using `tests/fixtures/github/*.json`.
- Run `npm test` and iterate to green.

## Notes

- Primary branch: a5c/main; PR will target it.
- Keep changes minimal and focused.
