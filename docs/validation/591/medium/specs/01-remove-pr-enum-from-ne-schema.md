# [Validator] [Specs] - Remove `"pr"` from `ref.type` enum in NE schema

## Context

- Current PR aligns GitHub PR events to emit `ref.type: "branch"` and preserves `ref.base`/`ref.head`.
- `docs/specs/ne.schema.json` still enumerates `"pr"` as an allowed `ref.type`.

## Impact

- Mismatch between emitted events and schema may confuse consumers and schema validation tools.

## Requirements

- Update `docs/specs/ne.schema.json` to remove `"pr"` from the `ref.type` enum and keep `branch|tag|unknown`.
- Update any references in docs to remove `"pr"` mentions.
- Regenerate any derived typings if applicable.

## Priority

- medium priority
