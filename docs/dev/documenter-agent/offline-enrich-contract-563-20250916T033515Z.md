# Dev Log — Offline GitHub Enrichment Contract (Issue #563)

## Scope

- Clarify the contract for offline vs online GitHub enrichment in CLI and README.
- Provide minimal JSON excerpts showing both modes.
- Add a unit test asserting the offline path behavior.

## Plan

1. Update README.md with an "Offline GitHub enrichment" subsection under CLI Reference.
2. Update docs/cli/reference.md to align language and add a compact example.
3. Add a test covering offline path (no `--use-github`): `enriched.github.partial=true` and `reason='flag:not_set'`.
4. Run tests and open a draft PR linked to #563.

## Notes

- CLI currently guards `--use-github` without token (exit 3). Offline default in `handleEnrich()` sets a stub with `reason: 'flag:not_set'`.
- Acceptance requested in #563 suggests omitting or stubbing. We retain the stub (present today) and document explicitly.
