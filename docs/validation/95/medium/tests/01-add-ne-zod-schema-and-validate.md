# [Validator] [Tests] Medium - Add NE Zod schema and validate

## Summary

Introduce a Zod schema for the Normalized Event (NE) model and validate outputs in tests to ensure structural correctness and forward stability.

## Rationale

The docs/specs indicate a strict schema for NE. Currently, normalization tests assert select fields only. A typed runtime schema (Zod) plus a validation test will:

- Catch regressions when fields change
- Enforce presence/format (e.g., `occurred_at` ISO)
- Document the contract in code

## Scope

- Add `src/schema/normalized-event.ts` exporting a Zod schema aligned with docs/specs/ne.schema.json and normalized-event.md
- Add `tests/normalize.schema.test.ts` that validates normalized outputs from fixtures (`workflow_run`, `pull_request`, `push`, `issue_comment`)
- Wire optional `schema_version` if present in docs/specs

## Acceptance Criteria

- CI runs tests which include schema validation
- All current fixtures pass schema validation
- Schema definition is referenced in README or docs/cli/ne-schema.md
