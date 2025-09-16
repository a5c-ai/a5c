# [Low] Documentation — Align README payload type with schema

## Summary

Resolved: `docs/specs/README.md` now aligns with `docs/specs/ne.schema.json` — `composed[].payload` is `object | array | null`.

Notes:

- Source of truth remains the schema file.
- Add docs lint to prevent regressions.

## Recommendation

- Option A: Update README wording to reflect the schema precisely (`object | array | null`).
- Option B: If primitives are intended, extend the JSON Schema to include `string | number | boolean` and update tests accordingly.

## Rationale

Keeps docs and validation contract in sync to avoid confusion for rule authors and downstream validators.
