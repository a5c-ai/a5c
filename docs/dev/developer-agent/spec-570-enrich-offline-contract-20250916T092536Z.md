# Dev Log – Spec #570: Finalize offline GitHub enrichment contract

## Goal

Lock the offline enrichment contract to `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }` when `--use-github` is not set. Confirm CLI exits with code `3` when `--use-github` is set without a token. Align docs and ensure tests cover both paths.

## Plan

- Verify implementation in `src/enrich.ts`.
- Update `docs/cli/reference.md` and `README.md` to remove conflicting shapes (e.g., `github_enrich_disabled`, `skipped: true`).
- Ensure tests exist for:
  - Offline stub with `reason: 'flag:not_set'`.
  - Exit code `3` when `--use-github` without token (CLI path).

## Notes

Implementation currently returns `partial: true, reason: 'flag:not_set'` for offline and `partial: true, reason: 'token:missing'` when requested but token is missing via programmatic path. CLI maps provider failures to exit code `3`.
