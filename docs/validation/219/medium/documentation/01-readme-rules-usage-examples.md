# [Validator] Documentation — Add README examples for `--rules`

## Summary
The new composed events rules feature adds a `--rules` flag to `events enrich` and outputs a top-level `composed[]` array when rules match. `docs/cli/reference.md` contains a brief example, but the root `README.md` lacks usage examples and guidance.

## Why it matters
Users discover features from the README. Clear examples accelerate adoption and reduce support friction.

## Requested changes
- Add a README section: "Composed Events via Rules" with:
  - YAML fixture example with predicates (`all/any/not`, `eq`, `contains`, `exists`) and JSONPath-like selectors with `[*]`.
  - JSON rules example for quick local testing.
  - Example CLI invocations and `jq` snippets to inspect `.composed[]`.
  - Note about minimal PR fields being seeded when GitHub API enrichment is disabled.
  - Caveats: intended for evaluation/triggering; payload projections resolve `"$.path"` values.

## Priority
medium priority

