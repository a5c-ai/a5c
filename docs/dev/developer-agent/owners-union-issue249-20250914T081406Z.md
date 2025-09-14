# Dev Log – owners_union for PR enrichment (Issue #249)

## Plan
- Compute owners_union from per-file CODEOWNERS resolution in `src/enrichGithubEvent.js`.
- Expose at `enriched.github.pr.owners_union` via `src/enrich.ts` passthrough.
- Add tests in `tests/enrichGithubEvent.test.js` and `tests/enrich.handle.test.ts` covering overlap and order.
- Update docs: `docs/cli/reference.md` and specs (`docs/specs/README.md` already mentions union; verify wording).

## Notes
- Sort union for stability and readability.
- Keep existing `owners` map intact.
