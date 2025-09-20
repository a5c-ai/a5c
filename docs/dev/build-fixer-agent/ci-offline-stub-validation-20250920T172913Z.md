# CI Fix: Add missing offline stub example for NE validation

- Context: Quick Checks failing at step "Validate offline stub example (NE schema)" due to missing file `docs/examples/enrich.offline.stub.json`.
- Action: Add a minimal NE-compliant stub example JSON file and validate locally.

## Plan

- Create `docs/examples/enrich.offline.stub.json` (minimal NE fields)
- Build CLI and run local validation
- Commit/push to PR branch a5c/main

## Notes

- NE schema: docs/specs/ne.schema.json
- Related examples: docs/examples/enrich.offline.json, enrich.online.json
