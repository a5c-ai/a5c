# [Validator] Tests — Expand coverage for rules evaluator

## Summary

Current tests exercise positive/negative paths and `contains` with array membership. Missing coverage for:

- `not` operator
- `exists` operator on nested paths
- Wildcard array selection with non-zero index and nested wildcard (e.g., `labels[*].props[*].name`)
- Payload projection behavior (string values as JSONPath vs. literals)

## Requested changes

- Add unit tests in `tests/rules.composed.test.ts` to cover the above.
- Include a projection test where `payload: { label0: "$.payload.pull_request.labels[0].name", static: 123 }` yields both a projected field and a literal.

## Priority

low priority
