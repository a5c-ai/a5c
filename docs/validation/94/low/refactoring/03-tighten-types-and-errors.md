# [Validator] [Refactoring] – Tighten typing and error surfaces

## Summary

- Provide typed surface for GitHub enrichment `_enrichment` where practical to improve DX and reduce `any` usage.
- Narrow `mapActor` return type to match `NormalizedEvent.actor` and consider surfacing `owner.login` in repo when available.
- Normalize error shape in `githubEnrichment.errors` (e.g., `{ message, code? }`) for easier downstream handling.

## Priority

low priority

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)
