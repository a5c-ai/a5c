# [Low] Documentation — Align README payload type with schema

## Summary

As of this update, `docs/specs/README.md` and `README.md` both align with `docs/specs/ne.schema.json`: `composed[].payload` is constrained to `object | array | null`. This note reflects the previous drift and can serve as a regression guard reference.

## Recommendation

- Option A: Keep docs aligned with the schema (`object | array | null`).
- Option B (not planned): If primitives are intended in the future, extend the JSON Schema to include `string | number | boolean` and update tests accordingly.

## Rationale

Keeps docs and validation contract in sync to avoid confusion for rule authors and downstream validators.
