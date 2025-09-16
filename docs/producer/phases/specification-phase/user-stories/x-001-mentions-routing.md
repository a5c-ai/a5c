# X-001: Extract Mentions for Agent Routing

As a workflow owner, I want `@agent` mentions extracted from commits and PRs so that agents trigger automatically with context.

## Acceptance Criteria

- Given a PR body mentioning `@developer-agent` and a commit mentioning `@researcher-base-agent`,
- When I run `events enrich --in pr.json`,
- Then `enriched.mentions[]` includes both with `source` and `context` populated,
- And confidence scores are present.

## Links

- Schema: docs/specs/README.md#42-mentions-schema
