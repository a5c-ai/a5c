# CI fix: offline GitHub enrich reason contract

## Context

- Failed workflow run: https://github.com/a5c-ai/events/actions/runs/17763648090
- Job: test → step `./scripts/test.sh`
- Failure: tests/cli.enrich.offline.contract.test.ts expects `reason="github_enrich_disabled"` but code returns `"flag:not_set"`.
- Other tests already assert `flag:not_set` (e.g., tests/enrich.basic.test.ts).
- Open issues indicate standardizing on `flag:not_set`.

## Plan

1. Align the CLI offline contract test to `flag:not_set`.
2. Run tests locally to verify pass.
3. Open PR against `a5c/main`, label as build/bug, enable auto-merge.

## Verification steps

- `npm ci && npm run test:ci` passes locally with the change.
