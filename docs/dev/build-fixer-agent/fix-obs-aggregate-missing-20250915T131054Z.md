# Build Fix: Add `.github/actions/obs-aggregate`

- Context: Failed Tests workflow on branch `a5c/main` with error:
  "Can't find 'action.yml' under .github/actions/obs-aggregate" during job "Aggregate Observability".
- Root Cause: Workflow referenced a non-existent local composite action `obs-aggregate`.
- Fix: Implement `.github/actions/obs-aggregate` composite action to download artifacts and emit `observability.aggregate.json`.
- Verification: Local lint; CI will run the Tests workflow and the Aggregate job should succeed.
