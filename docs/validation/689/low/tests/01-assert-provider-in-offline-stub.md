# Assert provider in offline stub

- Category: tests
- Priority: low

Context: Offline enrichment contract is `{ provider: 'github', partial: true, reason: 'flag:not_set' }`.

Suggestion:

- Extend tests (e.g., `tests/enrich.basic.test.ts`) to also assert `gh.provider === 'github'` for the offline path to lock the contract shape more tightly.

Rationale:

- Prevents regressions where `provider` might be omitted during refactors.
