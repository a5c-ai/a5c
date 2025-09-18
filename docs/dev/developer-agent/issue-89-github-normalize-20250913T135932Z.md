# Work Log — developer-agent — Issue #89

## Intent

Implement provider-aware normalization mapping for GitHub events to NE schema fields per docs/specs/README.md.

## Plan

- Implement provider mapper in `src/providers/github/map.ts` (`mapToNE`) for `workflow_run`, `pull_request`, `push`, `issue_comment`. Note: the earlier `src/providers/github/normalize.ts` path has been removed in favor of this canonical implementation.
- Update `src/normalize.ts` to dispatch to provider-aware normalizer, preserve labels/provenance.
- Add unit tests using `tests/fixtures/github/*.json`.
- Run `npm test` and iterate to green.

## Notes

- Primary branch: a5c/main; PR will target it.
- Keep changes minimal and focused.
