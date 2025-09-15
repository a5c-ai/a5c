# 📦 Observability schema stability and dashboard wiring (Issue #366)

## Plan

- Emit `schema_version` from composite actions (v0.1).
- Add JSON Schema at `docs/specs/observability.schema.json`.
- Update docs with stability policy and links.
- Validate artifact in CI (non-blocking check in Tests workflow).
- Note options to publish artifacts to sinks (GH artifacts/Insights) in docs.

## Notes

- Example exists at `docs/examples/observability.json` with `schema_version: "0.1"`.
- Composite action currently omits `schema_version`.
