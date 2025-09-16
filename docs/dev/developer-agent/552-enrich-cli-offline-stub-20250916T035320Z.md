# Tests: Enrich CLI offline stub and token-missing path (Issue #552)

Context: Align tests with product contract for offline GitHub enrichment and `--use-github` missing token behavior.

Plan:

- Add CLI test asserting offline stub shape: `provider: 'github'`, `partial: true`, `reason: 'flag:not_set'`.
- Keep existing `--use-github` without token exit code `3` test (no JSON assumption).

Changes:

- tests/cli.exit-codes.test.ts: assert offline stub provider/partial/reason values.

Notes:

- Implementation currently uses `reason: 'flag:not_set'` (docs mention `github_enrich_disabled` historically). Test follows implementation/README and avoids churn elsewhere.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
Date: 2025-09-16
