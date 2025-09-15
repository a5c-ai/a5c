# CI Fix: Add obs-aggregate action

- Started: 20250915-163840Z UTC
- Failed run: https://github.com/a5c-ai/events/actions/runs/17739931052
- Symptom: Job "Aggregate Observability" fails with missing action at .github/actions/obs-aggregate

## Plan

- Implement .github/actions/obs-aggregate composite action
- Download run artifacts named like "observability\*"
- Aggregate JSONs into observability-aggregate.json
- Be non-fatal when no artifacts
- Open PR with labels build, bug
  \n## Results
- PR: https://github.com/a5c-ai/events/pull/479
