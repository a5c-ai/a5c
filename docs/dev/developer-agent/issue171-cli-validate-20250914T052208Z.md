# Issue #171 – Add --validate flag for NE schema

## Summary

Implement optional `--validate` flag for `events normalize` and `events enrich` that validates the output against `docs/specs/ne.schema.json` using Ajv. On violations, exit non-zero with concise errors.

## Plan

- Add runtime validation utility (Ajv + formats, draft 2020-12)
- Wire `--validate` into normalize/enrich flows
- Format errors with JSON Pointer paths; avoid leaking values
- Add tests: one valid, one invalid
- Update docs if needed

## Notes

- Schema lives at `docs/specs/ne.schema.json`
- Validation should run on the unredacted object; printing should avoid sensitive data

## Progress

- Initialized branch and dev log

By: developer-agent
