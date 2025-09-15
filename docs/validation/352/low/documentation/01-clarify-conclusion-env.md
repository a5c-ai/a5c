# [Validator] [Documentation] Clarify `CONCLUSION` env usage in obs-summary README and workflow examples

Priority: low priority
Category: documentation

## Context

The PR description mentions passing `CONCLUSION` to the composite action; the test workflow does not pass it. The action currently accepts an optional `CONCLUSION` env and writes it into `observability.json`.

## Tasks

- Update README to clearly mark `CONCLUSION` as optional and provide an example of populating it.
- If we want automatic capture, document the recommended pattern (e.g., set in a final step via `${{ job.status }}` or aggregate conclusion outside of the action).

## Acceptance Criteria

- README examples align with tests.yml and accurately reflect required/optional envs.
