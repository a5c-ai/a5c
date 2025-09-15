# PR #56 Review and Schema Validation Fixes

## Summary

Validated `docs/specs/ne.schema.json` against JSON Schema Draft 2020-12 using `ajv-cli` with `ajv-formats`. Adjusted schema to replace `nullable: true` and union `type: [A,B]` with `anyOf` so validators in strict mode accept it.

## Changes

- `docs/specs/ne.schema.json`:
  - `repo.visibility`: use `anyOf` with `string` enum or `null` instead of `nullable`.
  - `ref.type`: use `anyOf` with `string` enum or `null` instead of `nullable`.
  - `payload`: replace `type: ["object","array"]` with `anyOf` for Ajv strict compatibility.
  - `provenance.workflow.run_id`: replace `type: ["integer","string"]` with `anyOf`.

## Validation

- Compiled schema with `ajv-cli@5` and `--spec=draft2020`.
- Validated a sample event instance successfully.

## Notes

- No functional change to schema semantics; only compatibility fixes.

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
