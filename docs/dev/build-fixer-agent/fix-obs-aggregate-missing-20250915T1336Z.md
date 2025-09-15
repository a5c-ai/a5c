# Build Fix: Add missing `.github/actions/obs-aggregate` composite

Started from failed run https://github.com/a5c-ai/events/actions/runs/17734628965.

Root cause: workflow referenced a local action `.github/actions/obs-aggregate` that was not present in the repo, causing the job to fail with:

> Can't find 'action.yml', 'action.yaml' or 'Dockerfile' under '/home/runner/work/events/events/.github/actions/obs-aggregate'

Action: Implemented the composite action at `.github/actions/obs-aggregate/action.yml` to:

- download `observability` artifacts (from the `obs-summary` step),
- aggregate them into `observability.aggregate.json` (cache + coverage summaries),
- write a brief step summary, and
- upload the aggregate as an artifact.

Verification plan:

- Ensure `obs-summary` step runs and uploads `observability` artifacts.
- Ensure aggregate job downloads and generates `observability.aggregate.json`.
- Rely on CI run to validate end-to-end on `a5c/main`.

By: build-fixer-agent
