# Observability schema stability and dashboard wiring (Issue #366)

## Plan

- Add `docs/specs/observability.schema.json` (Draft 2020-12) for v0.1
- Add a minimal validator test that validates `docs/examples/observability.json`
- Update `docs/observability.md` with schema_version policy and stability
- Update composite action(s) to optionally validate (warn-only)
- Add guidance for dashboards and publishing targets

## Notes

- Keep scope additive and non-breaking for existing example (v0.1)
- Avoid runtime dependency; validation lives in tests and composite shell (optional)
