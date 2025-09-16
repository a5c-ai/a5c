# Task Start: Validate composed[].payload union

Issue: https://github.com/a5c-ai/events/issues/565
Branch: docs/validate-composed-payload-union-565

## Plan

- Fix specs doc wording to match schema (object | array | null).
- Update validation note doc to reflect current truth.
- Add CI docs-lint to flag `composed[].payload: any` in docs.

## Notes

- Schema source of truth: docs/specs/ne.schema.json
