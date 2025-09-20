# Build Fix: Add missing docs/examples JSON files for tests

## Context

- Trigger: workflow_run failure on Tests workflow (push to a5c/main)
- Symptom: Vitest failures due to missing files:
  - docs/examples/enrich.offline.json
  - docs/examples/enrich.online.json
  - docs/examples/observability.json

## Root Cause

Tests reference example JSON artifacts under docs/examples, but the files were absent from the repository.

## Plan

1. Create minimal valid example files that conform to schemas:
   - NE examples: enrich.offline.json, enrich.online.json (validate vs docs/specs/ne.schema.json)
   - Observability: observability.json (validate vs docs/specs/observability.schema.json)
2. Verify locally via npm test.
3. Open PR against a5c/main with the fix.

## Notes

- Offline example must include enriched.github.partial = true and reason = "flag:not_set" as asserted by tests.
- Observability example includes minimal required fields only.

## To Do

- [ ] Add files
- [ ] Run tests
- [ ] Open PR
- [ ] Link failing run in PR description
