# [Validator] Tests - Expand detector edge cases

### Context

PR #378 adds `scripts/flaky-detector.cjs` and a basic unit test covering a fail→pass duplicate testcase scenario. The detector targets Vitest JUnit output and emits JSON-only to stdout (logs to stderr).

### Proposal

- Add additional unit tests to harden behavior and prevent regressions:
  - Multiple testsuites and nested structures (Vitest may wrap suites).
  - Skipped runs mixed with pass/fail (ensure skipped doesn’t count as pass).
  - Error nodes (`<error/>`) treated as failures alongside `<failure/>`.
  - Grouping by `file` fallback when `classname` is absent.
  - Minimum attempts threshold behavior via `MIN_ATTEMPTS` env.

### Rationale

Broader coverage ensures reliability as reporters or test structures evolve, and documents intended semantics for skipped/error handling and grouping keys.

### Priority

medium priority

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
