# Build Fix: Aggregate Observability job fails due to missing checkout

- Context: Workflow run https://github.com/a5c-ai/events/actions/runs/17738449387 failed in job "Aggregate Observability" with error:
  > Can't find 'action.yml', 'action.yaml' or 'Dockerfile' under '/home/runner/work/events/events/.github/actions/obs-aggregate'. Did you forget to run actions/checkout before running your local action?

- Root cause: The `aggregate` job in `.github/workflows/tests.yml` uses a local composite action (`./.github/actions/obs-aggregate`) without first checking out the repository.

- Plan:
  1) Add `actions/checkout@v4` at the start of the `aggregate` job steps.
  2) Open PR against `a5c/main` and enable auto-merge.
  3) Verify the next CI run reaches the aggregate step and completes.

