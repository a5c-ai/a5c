# [Validator] [Deployment] – Include PR quick workflows in a5c meta hook

- Priority: low
- Category: deployment

## Context

This PR adds optional Codecov upload steps to existing workflows: `Tests`, `PR Quick Tests` (`pr-tests.yml`), and `PR Quick Checks` (`quick-checks.yml`). The repository includes a meta workflow at `.github/workflows/a5c.yml` that listens on `workflow_run` for a subset of workflows: `Tests`, `Build`, and `Typecheck`.

## Suggestion

If downstream automations rely on the a5c meta workflow to react to PR coverage signals or quick checks, consider adding `PR Quick Tests` and `PR Quick Checks` to the `workflows:` list in `.github/workflows/a5c.yml`.

Example addition:

```yaml
on:
  workflow_run:
    workflows: [Tests, Build, Typecheck, PR Quick Tests, PR Quick Checks]
    types: [completed]
```

This keeps a5c’s dispatch aligned with the lightweight PR pipelines.

## Rationale

- Improves observability and consistency across CI surfaces.
- Non-blocking: existing hooks will still process `Tests` runs.
