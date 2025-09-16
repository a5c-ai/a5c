# Issue 570 - Finalize offline GitHub enrichment contract

## Context

Align docs with code for offline GitHub enrichment contract and CLI exit behavior when `--use-github` lacks a token.

## Plan

- Confirm current code paths and tests
- Update docs (CLI reference, README) to single contract: `{ provider: 'github', partial: true, reason: 'flag:not_set' }` for offline
- Clarify `--use-github` w/o token exits with code 3 (no output)
- Verify tests already assert offline stub and exit code

## Notes

- Code: `src/enrich.ts` uses `reason: "flag:not_set"` for offline.
- CLI: `src/cli.ts` guards `--use-github` w/o token and exits 3.
- Tests exist: `tests/enrich.basic.test.ts`, `tests/cli.exit-codes.test.ts`.
