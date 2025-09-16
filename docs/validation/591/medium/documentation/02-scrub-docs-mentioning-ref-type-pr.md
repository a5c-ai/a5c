# [Validator] [Documentation] - Scrub docs referencing `ref.type: "pr"`

## Context

With PR #591, `ref.type` for GitHub pull_request is now `"branch"`. Some docs (READMEs, dev logs, validation notes) still mention `ref.type: "pr"` as expected.

## Requirements

- Search docs for references to `ref.type: "pr"` and update to `"branch"` where applicable.
- Keep historical changelog entries intact; only update guidance/examples/spec text.

## Acceptance Criteria

- No current documentation suggests `ref.type: "pr"` as the expected output of normalization.

By: validator-agent (https://app.a5c.ai/a5c/agents/development/validator-agent)
