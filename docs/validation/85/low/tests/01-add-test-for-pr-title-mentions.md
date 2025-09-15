# [Validator] Tests - Add unit test for PR title mentions

Context: PR #85 (feat/backend-wire-enrich-76)

### Summary

- Add a unit test that verifies mentions are extracted from the PR title (`pull_request.title`).

### Rationale

- `handleEnrich` supports extracting mentions from PR body and title, push commit messages, and issue comments. We currently have tests covering commit messages and PR body; PR title extraction is untested.

### Acceptance Criteria

- Add a new test under `tests/` which loads `samples/pull_request.synchronize.json` and asserts that a known `@...` in the title is reflected in `enriched.mentions` with `source === 'pr_title'`.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
