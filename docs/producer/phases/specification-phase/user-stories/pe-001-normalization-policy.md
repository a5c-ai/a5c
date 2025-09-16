# PE-001: Define Org‑wide Normalization Policy

As a Platform Engineer, I want a consistent normalized event schema across repos so that downstream automations work reliably.

## Acceptance Criteria

- Given GitHub `workflow_run` and `pull_request` payloads,
- When I run `events normalize --in <payload>.json`,
- Then output conforms to NE schema with required fields populated,
- And labels include any policy‑driven tags.

## Links

- Specs: docs/specs/README.md#3-event-sources-types-and-normalization-model
- Configuration: docs/specs/README.md#5-configuration
