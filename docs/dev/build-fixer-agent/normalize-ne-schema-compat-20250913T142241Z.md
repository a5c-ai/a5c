# Build Fix: Normalize → NE schema compatibility

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17697679692
- Branch: a5c/main
- Failing tests: `tests/normalize.test.ts` (Ajv validation failures)

## Root Cause

- `src/providers/github/normalize.ts` produced fields not allowed by NE schema:
  - `provenance.workflow` included `run_number` and `run_attempt` (not in schema)
  - `ref.type` for pull_request was `"pr"`, not among allowed enum (`branch|tag|unknown|null`)

## Plan

- Remove non-schema fields from `provenance.workflow`
- Set pull_request `ref.type` to `"branch"`
- Run tests locally to verify

## Links

- NE schema: `docs/specs/ne.schema.json`
- Test: `tests/normalize.test.ts`

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
