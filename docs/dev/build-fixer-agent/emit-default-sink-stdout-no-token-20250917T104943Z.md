# Build Fix: emit default sink without token

## Context

- Workflow: Tests (.github/workflows/tests.yml)
- Failed run: https://github.com/a5c-ai/events/actions/runs/17794962737
- Trigger: push to a5c/main (226990f)

## Failure

- tests/emit.basic.test.ts: "writes to stdout by default" failed
- Error: expected code 0, received 1
- JUnit: testsuite tests/emit.basic.test.ts (1 failure)

## Root Cause

- Recent change set default sink to "github" when no --out is provided.
- Without token (A5C_AGENT_GITHUB_TOKEN/GITHUB_TOKEN), github sink errors -> code=1.

## Fix

- Default sink selection now:
  - explicit --sink wins
  - if --out provided -> file
  - else: github only if token exists, otherwise stdout
- File: src/emit.ts

## Verification

- npm ci && npm run build
- npm test -> 162 passed locally

## Links

- Failed run logs: https://github.com/a5c-ai/events/actions/runs/17794962737
- Job logs (Unit Tests): https://github.com/a5c-ai/events/actions/runs/17794962737/job/50580434284

By: build-fixer-agent (a5c)
