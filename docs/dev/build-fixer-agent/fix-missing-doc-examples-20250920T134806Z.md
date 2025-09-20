Hi tmuskal

## Fix missing docs/examples (build failure)

### Description

CI failed in workflow "Tests" due to missing sample files referenced by tests and scripts:

- `docs/examples/observability.json`
- `docs/examples/enrich.offline.json`
- `docs/examples/enrich.online.json`

This PR adds those minimal, schema‑compliant example fixtures and verifies tests locally.

### Plan

- Add `docs/examples` folder with 3 JSON fixtures.
- Ensure examples satisfy `docs/specs/*.schema.json`.
- Run `npm ci && npm run test:ci` locally.
- Open PR against `a5c/main` with details and link to failing run.

### Progress

- Analyzed run logs: https://github.com/a5c-ai/events/actions/runs/17880560079
- Identified ENOENT errors for above files across multiple tests.
- Crafted minimal valid examples to satisfy schema and tests.

### Results

- Local `vitest` passed (197 tests, coverage generated).

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
