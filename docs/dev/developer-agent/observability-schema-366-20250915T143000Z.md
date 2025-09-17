# 📦 Observability schema stability and dashboard wiring (Issue #366)

## Plan

- Add `legacy path under docs/schemas (removed)` (v0.1)
- Ensure `.github/actions/obs-summary` and `obs-collector` include `schema_version`
- Validate example `docs/examples/observability.json` against the schema
- Add CI check using Ajv to validate emitted artifact when present
- Document schema versioning and dashboard options in `docs/observability.md`

## Notes

- Schema starts at `0.1` and follows additive, backwards-compatible changes until `1.0`.
- Keep fields minimal: repo, workflow, job, run{...}, metrics{coverage, cache}.
