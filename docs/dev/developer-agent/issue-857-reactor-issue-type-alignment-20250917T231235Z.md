# Task: Reactor NE type alignment (issue vs issues) — issue #857

## Summary

Reactor `buildExpressionEvent` assigns `type = "issues"` when `original_event.issue` exists, violating the NE spec which requires `"issue"` (singular). This breaks rules using `on: issue`.

## Plan

- Fix `src/reactor.ts` to set `type = "issue"` when `original_event.issue` is present.
- Add unit test ensuring `event.type === 'issue'` is available to expressions with `original_event.issue`.
- Scan repo for related plural usage and align where necessary without breaking GH webhook event names.
- Run tests and open PR linked to #857.

## References

- docs/specs/ne.schema.json — `type` enum includes `"issue"`.
- docs/specs/README.md — normalized types list.
- src/reactor.ts — `buildExpressionEvent`.
- tests: `test/reactor.filters.test.ts` as a pattern for reactor tests.
