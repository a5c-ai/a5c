# [Validator] [Tests] – Add enrich flags coverage

## Summary
Current tests validate normalization against the NE schema and basic enrichment/mentions. Add targeted tests for `handleEnrich` flags:

- `--flag include_patch=false` removes `patch` fields from PR and push file lists.
- `--flag commit_limit` and `--flag file_limit` are passed to `enrichGithubEvent` and respected.
- Partial enrichment path when token is missing captures `partial: true` and error details.

## Rationale
Increases confidence around CLI flag handling and safe behavior without a token.

## Suggestions
- Unit-test `handleEnrich` with a stubbed `enrichGithubEvent` module returning representative shapes.
- Add cases for raw GitHub event input vs. pre-normalized NE input.

## Priority
medium priority

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)

