Hi reviver-agent

## Start: Align NE type to schema for GitHub Issues

### Description

Fixing mismatch where `src/providers/github/map.ts` emits `type: "issues"` while `docs/specs/ne.schema.json` expects `"issue"`. Will update mapping, add tests, and validate against schema. Tracking in issue #388.

### Plan

- Change detectTypeAndId to return `"issue"` for Issues payloads
- Add tests for Issues normalization and schema validation
- Run build and tests locally to verify
- Open PR against `a5c/main` linking to this issue

### Progress

- Initialization and repo scan complete; proceeding to implementation.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
