[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Docs: Align offline GitHub enrichment reason (issue #663)

## Context

Validator flagged mismatch: docs showed `reason: 'flag:not_set'` for offline mode, while implementation/contract uses `reason: 'github_enrich_disabled'`. SDK note about `reason: 'token:missing'` (injected Octokit w/o token) must remain.

## Plan

- Update `docs/cli/reference.md` to use `github_enrich_disabled` for offline examples and prose.
- Update `README.md` to reflect the same.
- Update `docs/user/quickstart.md` snippet.
- Verify user-facing docs contain no `flag:not_set`.

## Notes

No code/test changes. CLI keeps exit code 3 on `--use-github` without token; SDK may return `reason: 'token:missing'` in programmatic paths.
