# Issue #192 – Security: Token precedence and redaction tests (kickoff)

- Scope: add unit tests for `src/config.ts` (token precedence, debug flag) and extend redaction coverage with representative payloads; update CLI docs and link from specs.
- Plan:
  1. Add tests: `tests/config.token.test.ts`, `tests/redact.patterns.test.ts`
  2. Update docs: `docs/cli/reference.md` (token precedence section) and cross-link from specs
  3. Verify with `npm test` and open PR
