# Observability Schema Stability – Work Log (Issue #366)

## Plan

- Add `schema_version` to emitted `observability.json` in both composite actions
- Publish `docs/specs/observability.schema.json` (Draft 2020-12)
- Add `docs/examples/observability.v0.1.json` example
- Update docs: `docs/observability.md`, composite action READMEs, and README link
- Optional: add `POST_OBS_URL` hook to obs-summary to POST artifact (disabled by default)

## Notes

- Existing example already uses `schema_version: "0.1"`; align emitters and schema to that
- Keep fields additive; do not break current consumers

## Checklist

- [ ] Emit `schema_version` in obs-summary and obs-collector
- [ ] Add JSON Schema and example
- [ ] Link docs and README
- [ ] Optionally POST to external URL when configured
