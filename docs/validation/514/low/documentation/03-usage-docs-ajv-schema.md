# [Validator] Documentation - Clarify schema usage in README

## Context

The PR adds `validate:obs` and `validate:obs:file` scripts and an optional validation in the composite action.

## Suggestion

Add a README section:

- What `observability.json` contains (fields overview) and link to `docs/specs/observability.schema.json`.
- How to validate locally: `npm run validate:obs -- docs/examples/observability.json`.
- How to enable validation in workflows: set `VALIDATE_OBS_SCHEMA: true`.

## Rationale

Improves discoverability and consistent usage across repos.

## Priority

low priority
