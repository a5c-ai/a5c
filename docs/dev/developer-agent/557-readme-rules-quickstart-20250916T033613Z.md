# Issue #557 – README: Add Rules usage example

- Branch: chore/docs/readme-rules-quickstart-557
- Goal: Add a minimal rules YAML + CLI invocation to README and link specs §6.1 and CLI reference.

## Plan

1. Insert a concise example under CLI Reference showing `events enrich --rules` with a sample file.
2. Cross-link to `docs/specs/README.md#61-rule-engine-and-composed-events` and `docs/cli/reference.md`.
3. Ensure example uses existing `samples/pull_request.synchronize.json` and `samples/rules/conflicts.yml` so it runs end-to-end.

## Notes

- Use jq guard `(.composed // [])` for absent matches.
- Keep example tokenless (offline mode) unless needed. For this rule, GitHub mergeable_state may require `--use-github`; document that.
