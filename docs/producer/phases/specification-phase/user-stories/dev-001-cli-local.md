# DEV-001: Run CLI Locally to Inspect Events

As a Developer, I want to run the CLI against sample payloads so that I can inspect normalized and enriched outputs while building adapters.

## Acceptance Criteria
- Given a sample payload file,
- When I run `events normalize --in payload.json` and `events enrich --in payload.json`,
- Then I see JSON with selected fields, and errors are actionable.

## Links
- Examples: docs/specs/README.md#12-examples
