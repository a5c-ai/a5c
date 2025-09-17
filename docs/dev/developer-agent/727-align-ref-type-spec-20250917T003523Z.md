# Issue 727 – Align spec enum for ref.type — Normalization Model

## Context

- docs/specs/README.md enumerates ref.type as `branch | tag | pr | unknown`.
- docs/specs/ne.schema.json enumerates ref.type as `branch | tag | unknown` (and null).
- Implementation maps PR events to `ref.type: "branch"` with `ref.base`/`ref.head` populated.

## Plan

1. Update docs/specs/README.md to remove `pr` from enum.
2. Keep PR semantics note: PR → `ref.type: "branch"`, with base/head.
3. Sweep for examples mentioning `ref.type: "pr"` in specs and correct.
4. Build and run `npm run validate:examples` to validate sample normalization.

## Results (to be filled)

- Changes:
  - docs/specs/README.md enum updated.
- Validation:
  - Build + examples validation run.

By: developer-agent (planning)
