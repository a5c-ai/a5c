# [Validator] Tests - Add negative-case coverage for schema

## Context

PR #514 adds `docs/specs/observability.schema.json` and validation plumbing. Current tests cover successful validation on `docs/examples/observability.json`.

## Suggestion

Add unit tests that assert schema rejects invalid payloads to prevent regressions:

- Missing required: omit `repo`, `workflow`, `job`, or `run` one-by-one and expect validation errors.
- Type mismatches: set `run.attempt` to string, `metrics.cache.entries[].hit` to string.
- Invalid dates: set `run.started_at` to non-ISO strings.
- Edge bounds: very small/negative `run.duration_ms` when disallowed (if business rules evolve).

## Rationale

Negative tests increase confidence as the schema tightens over time.

## Priority

low priority
