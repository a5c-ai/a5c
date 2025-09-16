# Enrich CLI offline stub + token-missing tests (issue #552)

Scope: Add CLI test to assert offline GitHub enrichment stub shape and keep existing token-missing exit code test behavior.

Plan:

- Verify current behavior and tests via `npm test`.
- Add CLI test asserting offline stub: `enriched.github.provider === 'github'`, `partial === true`, `reason === 'flag:not_set'`.
- Keep token-missing `--use-github` exit code 3 test intact without assuming JSON.
- Run tests locally and open a PR linked to #552.

Notes:

- Current SDK and goldens use `reason: 'flag:not_set'` for offline mode. Docs contain mixed references (`github_enrich_disabled` vs `flag:not_set`); this test follows the runtime and goldens to avoid breaking changes.

Results (to be updated after implementation):

- Tests pass locally and in CI.
