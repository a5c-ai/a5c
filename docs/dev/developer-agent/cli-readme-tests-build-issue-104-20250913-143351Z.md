# Issue #104: CLI README tests require dist build

## Context
- Tests (README examples) expect `node dist/cli.js` to exist.
- Locally, `npm test` may run before build, causing MODULE_NOT_FOUND.

## Decision
Add `pretest` script to ensure `npm run build` runs before tests.

## Changes
- package.json: add `"pretest": "npm run build"`.

## Verification
Ran `npm ci && npm test` locally: all tests passed.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
