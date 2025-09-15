# CI gates and fast PR checks (Issue #304)

## Summary
Establish quick PR checks (lint, typecheck, unit tests) and move heavy gates to push on a5c/main. Keep checks fast (<5 min) and add docs.

## Plan
- Create Quick Checks workflow for PRs (typecheck + unit tests)
- Keep lint as a separate lightweight PR check
- Restrict heavy Build/Tests workflows to push on a5c/main and main
- Upload coverage artifacts for diagnostics
- Update a5c router workflow_run list to include Quick Checks
- Add docs describing triggers and required checks

## Context
Existing workflows: lint.yml (PR), tests.yml (PR+push), main.yml (PR+push), release.yml, deploy.yml, a5c.yml.

## Next
Open draft PR, then implement workflows and docs.

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
