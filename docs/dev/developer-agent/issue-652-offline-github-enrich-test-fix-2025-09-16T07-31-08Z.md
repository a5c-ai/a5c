# Fix: offline GitHub enrichment test reason alignment

Issue: #652

## Summary

Align test expectation to the unified offline GitHub enrichment reason `github_enrich_disabled`.

## Steps

- Reproduced failing test locally with Vitest.
- Updated `tests/cli.enrich.offline.contract.test.ts` expectation and title.
- Will run full CI test suite via PR.

## Verification

- Local targeted run passes.

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
