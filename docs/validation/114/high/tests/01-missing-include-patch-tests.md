# Missing tests: include_patch flag behavior

Priority: high
Category: tests

Context:
- Specs (docs/specs/README.md §4.1) define `include_patch` flag to control presence of `patch` diffs in file entries.
- Implementation in `src/enrich.ts` supports `--flag include_patch=false` by removing `patch` from both PR and push file lists.
- Current unit tests do not assert the flag behavior (presence/absence of `patch` under both PR and push flows).

Ask:
- Add tests that run `handleEnrich()` with `flags: { include_patch: false }` for both PR and Push cases and assert that `enriched.github.pr.files[*].patch` and `enriched.github.push.files[*].patch` are absent/undefined.
- Add companion tests with `flags: { include_patch: true }` validating that `patch` is present when the underlying GitHub payload includes it.

Notes:
- Keep file size limits in mind; you can simulate minimal `patch` content in mocks.
- This is non-blocking for PR #114 but recommended to prevent regressions.
