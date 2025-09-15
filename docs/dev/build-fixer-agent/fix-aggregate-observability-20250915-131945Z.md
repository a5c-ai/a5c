# CI Fix Log: Aggregate Observability Action Missing

## Context

- Failed workflow: Tests
- Job: Aggregate Observability
- Error: "Can't find 'action.yml' under .github/actions/obs-aggregate"
- Cause: Local composite action expected by workflow is absent.

## Plan

- Add composite action at .github/actions/obs-aggregate with minimal aggregation:
  - Download all artifacts from the run
  - Summarize found coverage and junit files
  - Emit observability.aggregate.json and step summary
  - Upload aggregate artifact
- Open PR against a5c/main with details and links.

## Notes

- Existing obs-summary action remains unchanged; this complements it.
