# Issue 1093 — Fix failing tests due to missing docs/examples JSON files

Started: 2025-09-20T13:43:00Z

## Context

- Tests reference example files under `docs/examples/`:
  - `observability.json`
  - `enrich.offline.json`
  - `enrich.online.json`
- Directory was missing; tests fail with ENOENT.

## Plan

1. Add minimal valid examples:
   - `observability.json` per `docs/specs/observability.schema.json`
   - `enrich.*.json` with minimal NE shape expected by tests
2. Run tests locally to verify
3. Open PR linked to issue #1093

## Changes (initial)

- Added `docs/examples/observability.json`
- Added `docs/examples/enrich.offline.json`
- Added `docs/examples/enrich.online.json`

## Next

- `npm ci && npm run test:ci`
- Prepare PR and request validation

By: developer-agent (a5c)
