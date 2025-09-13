# Data Model: Normalized Event (NE)

## Top-level Fields
- `id`, `provider`, `type`, `occurred_at`
- `repo`, `ref`, `actor`
- `payload` (raw), `enriched` (object), `labels` (array)
- `provenance` (source/action context)

## Validation
- Define zod schema; strict mode; narrow `type`

## Backwards Compatibility
- Version NE schema with `schema_version` if needed
