# [Low] Documentation — Align README payload type with schema

## Summary
`docs/specs/README.md` describes `composed[].payload` as `any`, while `docs/specs/ne.schema.json` constrains it to `object | array | null`.

## Recommendation
- Option A: Update README wording to reflect the schema precisely (`object | array | null`).
- Option B: If primitives are intended, extend the JSON Schema to include `string | number | boolean` and update tests accordingly.

## Rationale
Keeps docs and validation contract in sync to avoid confusion for rule authors and downstream validators.

