# Build Fix: Aggregate Observability checkout

- Workflow run: https://github.com/a5c-ai/events/actions/runs/17734387741
- Failure: Aggregate Observability job failed with "Can't find 'action.yml' under .github/actions/obs-aggregate".
- Root cause: The job uses a local action path but does not run actions/checkout first.

## Plan
- Add actions/checkout@v4 step to the `aggregate` job before using the local action.
- Open PR against a5c/main with build/bug labels.
- Verify by re-running Tests workflow once merged.
