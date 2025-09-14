#[Validator] [Documentation] – Add README docs for `--validate`

Priority: low priority
Labels: validator, documentation

## Context
PR #184 adds a `--validate` flag to `events normalize` and `events enrich` that validates outputs against `docs/specs/ne.schema.json` using Ajv (2020-12) with `date-time` format.

## Gap
README currently documents schema validation via `ajv-cli`, but does not include the new built‑in `--validate` flag usage or its failure behavior (non‑zero exit, helpful errors, redacted paths).

## Recommendation
- In README “CLI Reference”, under `normalize` and `enrich`, add examples:
  - `events normalize --in samples/push.json --validate`
  - `events enrich --in samples/pull_request.synchronize.json --validate`
- Note behavior on failure: prints Ajv messages with redacted sensitive paths; exits with code 1.
- Mention that `--validate` uses JSON Schema draft 2020‑12 and supports `date-time` format.

## Rationale
Improves discoverability and aligns docs with the new CLI feature; reduces reliance on `ajv-cli` in quickstart paths while keeping the schema path canonical.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
