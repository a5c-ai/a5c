# Dev Log — Issue #454: Clarify composed events examples

- Add `jq` guard: `(.composed // []) | map({key, reason})`
- Note `reason` is optional depending on rule configuration.
- Touchpoints: README.md and docs/cli/reference.md.

Plan:

1. Scan for unguarded `.composed[]` examples
2. Update snippets and notes
3. Open PR and request validation review

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
