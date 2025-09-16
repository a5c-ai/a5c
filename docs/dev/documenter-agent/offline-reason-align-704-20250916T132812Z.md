# Docs Task: Align offline GitHub enrich reason

- Issue/PR: https://github.com/a5c-ai/events/pull/704
- Scope: Replace lingering `github_enrich_disabled` in product docs with `flag:not_set` for offline mode. Keep `token:missing` for requested-but-missing token.

## Plan

- Audit docs for mismatches.
- Update `docs/cli/reference.md` behavior bullets and examples.
- Verify `docs/user/quickstart.md` shows `flag:not_set` (already correct).
- Cross-check README consistency.

## Findings (initial scan)

- `docs/cli/reference.md` has mixed mentions: behavior bullet uses `flag:not_set`, but details section still shows `github_enrich_disabled`.
- `docs/user/quickstart.md` already uses `flag:not_set`.
