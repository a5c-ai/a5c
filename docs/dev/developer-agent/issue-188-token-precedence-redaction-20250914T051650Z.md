# Issue #188 – Token precedence and redaction tests

## Plan

- Add unit tests for `loadConfig()` precedence: `A5C_AGENT_GITHUB_TOKEN` > `GITHUB_TOKEN`
- Add redaction regression tests using fixtures (JWT, GitHub PAT, Bearer, Slack, URL basic auth)
- Update docs: `docs/cli/reference.md` with tokens & redaction; link from specs
- Verify tests, open PR targeting `a5c/main`

## Notes

Implementation exists in `src/config.ts` and `src/utils/redact.ts`; focus on tests and docs.

## Results

- Added tests: `tests/config.token-precedence.test.ts`, `tests/redaction.regression.test.ts`
- Updated docs: `docs/cli/reference.md` (secrets & precedence), added `docs/producer/phases/technical-specs/notes-token-precedence-redaction.md`
- All tests passing locally via `npm test`
