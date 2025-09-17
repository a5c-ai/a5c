# Task: Deduplicate observability schema location — Docs organization

- Issue: #859
- Canonical: `docs/specs/observability.schema.json`
- Remove: legacy duplicate under `docs/schemas/`
- Goals:
  - Update references to canonical path
  - Add CI guard to prevent duplicates
  - Verify `npm run validate:obs:file`

## Plan

1. Remove legacy duplicate under docs/schemas
2. Replace any repo references to the legacy docs/schemas path
3. Add CI/script guard to forbid duplicates
4. Run local validation and grep checks
5. Document results here

## Notes

Initial commit to start PR and track progress.
