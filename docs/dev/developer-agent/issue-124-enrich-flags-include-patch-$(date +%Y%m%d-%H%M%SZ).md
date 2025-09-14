## Work Log — Issue #124 — Enrich flags coverage (include_patch)

Context: Add tests for `--flag include_patch=true|false` verifying patch inclusion/removal in GitHub enrichment. Open a follow‑up to decide default (proposal: false).

Plan:
- Add vitest covering `include_patch` true vs false on PR enrichment.
- Use mock Octokit to avoid network and ensure files contain `patch`.
- Open follow‑up issue about default.

Notes:
- Current code default is `true` (src/enrich.ts). Specs suggest default should be `false`.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)

