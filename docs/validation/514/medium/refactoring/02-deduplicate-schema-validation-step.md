# [Validator] Refactoring - Deduplicate schema validation in composite action

## Context

`.github/actions/obs-summary/action.yml` performs optional schema validation twice:

1. Inline Node/Ajv under the "Collect metrics and write summary + file" step when `VALIDATE_OBS_SCHEMA=true`.
2. A later dedicated step using `npx ajv` with `--spec=draft2020`.

## Suggestion

Keep a single validation path to avoid duplicate log lines and potential divergence:

- Prefer the dedicated step using `npx ajv` or
- Export a small reusable `node scripts/validate-obs.mjs --schema ...` invocation and call it once.

## Rationale

DRY, easier maintenance, consistent behavior across environments.

## Priority

medium priority
