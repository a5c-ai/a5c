# Task: Observability schema stability and dashboard wiring (Issue #366)

## Intent

Stabilize `observability.json` schema (`schema_version`), publish example/schema docs, and explore dashboard wiring for artifacts.

## Plan

- Define JSON Schema v0.1 at `docs/specs/observability.schema.json`
- Validate `docs/examples/observability.json` via a small node script or CI step
- Update `docs/observability.md` with versioning policy and change management
- Confirm composite action emits `schema_version` and minimal required fields
- Investigate artifact sinks (Artifacts, GH Insights) and document approach

## Notes

Existing:

- Composite action `.github/actions/obs-summary` writes `observability.json`
- Example: `docs/examples/observability.json` with `schema_version: "0.1"`
- Tests workflow uploads observability artifact with `if: always()`
