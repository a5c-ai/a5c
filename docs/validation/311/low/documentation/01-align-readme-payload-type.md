# [Low] Documentation — Align README payload type with schema

Status: Resolved (2025-09-16)

## Summary

`docs/specs/README.md` and `docs/specs/ne.schema.json` are aligned: `composed[].payload` is `object | array | null`.

## Notes

- Source of truth remains the schema file.
- A CI docs-lint is in place to prevent regressions. See `.github/workflows/docs-lint.yml` and `scripts/docs-lint.sh`.

## Recommendation

No further action needed. If primitives are required in the future, update both the schema and docs together and adjust the docs-lint.

## Rationale

Keeps docs and validation contract in sync to avoid confusion for rule authors and downstream validators.
