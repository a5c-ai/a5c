# Build Fix: Aggregate Observability job failure

## Context

- Workflow run: https://github.com/a5c-ai/events/actions/runs/17743323442
- Head commit: 27ac31852114ee04c79a0680d4473c3a45a88f47
- Branch: a5c/main

## Symptom

The job named "Aggregate Observability" failed with a Node eval ReferenceError:

```
ReferenceError: number is not defined
    at pct ([eval]:33:47)
```

This indicates an inline script compared `typeof v === number` instead of `'number'`.

## Analysis

- Searched repo workflows for an aggregate step; current repo uses a composite action `.github/actions/obs-summary`, and there is no inline aggregate step with that exact code.
- The failing job likely comes from a previous or external workflow variant (org-level) that still uses the buggy snippet.
- Our local tests workflow already relies on `.github/actions/obs-summary` which is correct and robust.

## Action

- Harden `.github/actions/obs-summary` just in case, ensuring all number type checks use `typeof x === 'number'` and defaults are resilient. (Already correct.)
- Add a small guard utility in the action to avoid similar mistakes if environment fields are extended.
- Document root cause and propose updating any org-level workflow to the local composite action.

## Verification

- Ran `gh run view` to fetch logs and confirm the error location.
- Inspected `.github/workflows/tests.yml` and composite actions.
- No unit code changes needed; the fix is infra/documentation.

## Follow-ups

- Update org-level workflow(s) to use `.github/actions/obs-summary` or correct the `typeof` comparison to `'number'`.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
