# [Low] Tests - Improve coverage for config and CLI

### Context

Current scaffold validates core extractor and a sample util, but coverage is low overall, and key surfaces (`src/config.ts`, `src/cli.ts`) are untested.

### Proposal

- Add unit tests for `loadConfig()` behavior with and without `A5C_AGENT_GITHUB_TOKEN` and `GITHUB_TOKEN` set; verify `debug` flag parsing.
- Add CLI tests using `vitest` + child process spawn to cover `mentions` command with stdin and `--file` path, `--window`, and `--known-agent` flags.
- Exclude CLI entrypoint from coverage if needed via `vitest.config.ts` `coverage.exclude`, or maintain minimal tests to keep it included.

### Acceptance

- Coverage increases for `src/config.ts` and `src/cli.ts` to >80% lines.
- Tests run in CI via existing `tests.yml` with no flakiness.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
