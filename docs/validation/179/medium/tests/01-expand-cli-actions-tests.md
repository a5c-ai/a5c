#[Validator] [Tests] - Expand CLI actions source tests

### Summary
The new `tests/cli.actions-source.test.ts` covers input resolution logic. Consider adding an end-to-end test that runs the CLI `events normalize --source actions` using a temporary file and `GITHUB_EVENT_PATH` to validate integration wiring.

### Recommendation
- Add a CLI e2e test that spawns the binary with `GITHUB_EVENT_PATH` set, and asserts successful output and exit code `0`.
- Add a negative e2e test with `--source actions` and missing `GITHUB_EVENT_PATH` to assert exit code `2` and error message on stderr.

### Rationale
Strengthens confidence that Commander wiring and process exit codes behave as documented beyond unit-level helper tests.

### Priority
medium priority

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)

