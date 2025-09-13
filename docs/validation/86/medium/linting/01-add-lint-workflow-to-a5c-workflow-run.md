# [Validator] Lint workflow missing from a5c.yml workflow_run

Priority: medium
Category: linting

## Summary
The new `.github/workflows/lint.yml` is a fast PR check and correctly targets `pull_request` on `a5c/main` and `main`. Per repo conventions, when adding new workflows we should also register them in `.github/workflows/a5c.yml` under `on.workflow_run.workflows` so that the agent router can react to their completion events.

## Expected
- `.github/workflows/a5c.yml` includes `Lint` in:
  ```yaml
  on:
    workflow_run:
      types: [completed]
      workflows: [Build, Deploy, Packages Npx Test, Lint]
  ```

## Suggested Change
- Update `.github/workflows/a5c.yml` to add `Lint` to the `workflows` array under the `workflow_run` trigger.
- Keep the lint job fast to remain eligible for PR triggers.

## Notes
- Non-blocking for this PR; functional linting works and `npm run lint` passes locally with 0 errors (3 warnings).

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)
