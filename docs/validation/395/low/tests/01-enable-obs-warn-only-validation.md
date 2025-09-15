# [Low] Tests — Enable warn-only schema validation in CI

### Context

The `.github/actions/obs-summary` composite supports optional schema validation for the produced `observability.json` using Ajv (Draft 2020‑12), guarded by `OBS_VALIDATE_SCHEMA=true`. It is currently not enabled in the Tests workflow.

### Proposal

- Set `OBS_VALIDATE_SCHEMA: true` in the `Obs Summary & Artifact` step environment in `.github/workflows/tests.yml` to run a warn-only validation of the produced artifact against `docs/specs/observability.schema.json` on every run.

### Rationale

- Early-detects drift between emitted artifact and the v0.1 schema without breaking CI.
- Complements the existing unit test and example validation step.

### Acceptance

- CI logs show a validation message in the "Observability summary" step.
- No CI failures when schema and artifact match; warnings printed if they diverge.
