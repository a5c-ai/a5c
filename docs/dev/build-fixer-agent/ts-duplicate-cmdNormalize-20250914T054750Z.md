# Fix: TS Duplicate Identifier 'cmdNormalize'

- Workflow run: https://github.com/a5c-ai/events/actions/runs/17707087488
- Commit: 53f07b34c346a357172810d9401268bc6b021947

## Plan
- Remove duplicate alias export causing TS2300 in src/commands/normalize.ts
- Build and run tests locally
- Open PR against a5c/main

## Notes
Two exported symbols named `cmdNormalize` existed: a function and an alias to `runNormalize`. Removing the alias preserves both `cmdNormalize` and `runNormalize` named exports and matches current imports in src/cli.ts and src/normalize.ts.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
