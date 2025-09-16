# [Low] Tests — Centralize env setup/teardown

### Context

`tests/mentions.flags.e2e.test.ts` repeats environment save/restore for `A5C_AGENT_GITHUB_TOKEN` and `GITHUB_TOKEN` in each test.

### Suggestion

Extract a helper or use `beforeEach`/`afterEach` to centralize env preservation/restoration. This reduces duplication and future drift.

### Rationale

- Improves readability and maintainability.
- Prevents subtle state leaks if new tests are added.

### Scope

Local to the test file or a shared test util.
