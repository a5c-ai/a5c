# Build Fix: Add missing obs-aggregate composite action

Context: Workflow run https://github.com/a5c-ai/events/actions/runs/17740302957 failed at job "Aggregate Observability" with:

> Can't find 'action.yml', 'action.yaml' or 'Dockerfile' under '.github/actions/obs-aggregate'

Root cause: `.github/workflows/tests.yml` references a local composite action `.github/actions/obs-aggregate`, but the action folder/file is not present on `a5c/main`.

Fix plan:
- Implement `.github/actions/obs-aggregate` as a composite action that downloads `observability` artifacts from prior jobs, merges them into a single `observability.aggregate.json`, appends a step summary, and uploads the aggregate as an artifact.
- Keep it self-contained (Node + bash), no external marketplace deps.

Verification steps:
- Local reasoning: matches usage in tests workflow. Ensures artifact is uploaded even if no files found (warn-only).
- CI should now find the action and run the aggregation step instead of failing immediately.

Notes:
- Aggregation strategy: shallow merge of arrays (`jobs`, `cache.entries`) and best-effort extraction of top-level `metrics.coverage` summary from first artifact if present; records contributing runs for traceability.

Links:
- Failed run: https://github.com/a5c-ai/events/actions/runs/17740302957

