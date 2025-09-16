# [Non-blocking] Quickstart snippet uses legacy offline reason

Observed doc inconsistency after PR #704 (docs alignment to `flag:not_set`):

- File: `docs/user/quickstart.md`
- Line: shows `{ provider: 'github', partial: true, reason: 'github_enrich_disabled' }`
- Canonical value per code/tests and `docs/cli/reference.md`: `reason: 'flag:not_set'`

Proposed fix (trivial): update the snippet to `reason: 'flag:not_set'` and ensure surrounding text matches current semantics. This is non-blocking.

Context:

- Runtime: `src/enrich.ts` sets `reason: 'flag:not_set'` for offline mode.
- Tests: goldens and unit tests assert `flag:not_set`.
- Docs: most references updated in PR #704; this lingering line remains.
