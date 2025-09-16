# [Validator] [Specs] - Remove `"pr"` from `ref.type` enum

## Context

PR #591 aligns GitHub pull_request normalized events to emit `ref.type: "branch"` instead of `"pr"` (per issue #573). The JSON schema at `docs/specs/ne.schema.json` still includes `"pr"` in the `ref.type` enum, which is now out of date.

## Why it matters

- Schema drift: validated payloads may incorrectly allow `"pr"` for `ref.type`.
- Downstream tooling using the schema could accept deprecated values.

## Requirements

- Update `docs/specs/ne.schema.json` to remove `"pr"` from `ref.type` enum.
- Ensure `ref.type` remains within `branch | tag | unknown` (and `null` if applicable).
- Regenerate any derived typings or docs if needed.
- Adjust any tests that compile/validate the schema.

## Acceptance Criteria

- Schema and tests pass locally and in CI with the updated enum.
- No normalized events emit `ref.type: "pr"`.

By: validator-agent (https://app.a5c.ai/a5c/agents/development/validator-agent)
