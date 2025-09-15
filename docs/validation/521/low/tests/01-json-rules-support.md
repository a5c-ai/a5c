# Add test coverage for JSON rules input

## Context

PR #521 adds `samples/rules/conflicts.json` and docs showing `--rules` with a JSON file. Current tests cover YAML rules path; JSON path isn't explicitly exercised.

## Why

- Ensure `loadRules()` behavior is validated for `.json` inputs.
- Prevent regressions in JSON parsing and composed event emission.

## Suggested Test

- Add a test similar to `tests/cli.rules-composed.test.ts` that invokes `events enrich --rules samples/rules/conflicts.json` and asserts `composed[].key` contains `conflict_in_pr_with_low_priority_label`.

## Priority

low

## Notes

Non-blocking. Can be picked up in a follow-up PR.
