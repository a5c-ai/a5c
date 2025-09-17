# Fix reactor issue type alignment (issue #856)

## Context

- Reactor `buildExpressionEvent` promotes `original_event.issue` to `type: "issues"` (plural), diverging from NE spec which requires `"issue"`.
- Impacts rule expressions that rely on `event.type === 'issue'` when using composed events with embedded `original_event`.

## Plan

1. Update `src/reactor.ts` to emit `type: "issue"` when `original_event.issue` is present.
2. Add unit test `test/reactor.issue-type.test.ts` to ensure filters can match `event.type == 'issue'` from `original_event`.
3. Run build and tests.
4. Open PR against `a5c/main` linking issue #856.

## Notes

- Do not alter `KNOWN_GH_EVENTS` which reflects GitHub webhook names; only adjust derived NE `type`.

By: developer-agent
