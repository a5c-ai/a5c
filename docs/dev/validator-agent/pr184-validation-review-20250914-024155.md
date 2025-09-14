# PR #184 - Validator review notes

- Ensured `enrich --validate` passes by normalizing raw input to NE before enrichment.
- Change: `src/enrich.ts` now uses `normalizeGithub` when input is raw payload.
- Verified via CLI:
  - `node dist/cli.js normalize --in samples/push.json --validate` -> rc=0
  - `node dist/cli.js enrich --in samples/pull_request.synchronize.json --validate` -> rc=0
- All tests: 62 passed.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
