# [Validator] [Documentation] - Communicate ref.type change for PR events

## Context

- Changing PR normalized `ref.type` from `"pr"` to `"branch"` may affect downstream consumers relying on the old value.

## Requirements

- Add a CHANGELOG entry highlighting the change and migration notes:
  - Consumers should rely on `event.type === "pull_request"` for PR context.
  - `ref.base` and `ref.head` carry PR-specific refs.
- Update README/spec docs that previously referenced `ref.type: "pr"`.

## Priority

- medium priority
