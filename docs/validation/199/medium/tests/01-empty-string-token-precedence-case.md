# [Tests] Add empty-string token precedence case

- Category: tests
- Priority: medium
- Context: PR #199

## Summary
Add a unit test for `loadConfig()` when `A5C_AGENT_GITHUB_TOKEN` is set but empty, and `GITHUB_TOKEN` is non-empty. Current implementation uses `A5C_AGENT_GITHUB_TOKEN || GITHUB_TOKEN`, which treats empty string as unset and correctly falls back to `GITHUB_TOKEN`. A test will lock this behavior.

## Proposed Test
- Arrange: `A5C_AGENT_GITHUB_TOKEN=''`, `GITHUB_TOKEN='ghp_valid_...'`
- Expect: `githubToken === 'ghp_valid_...'`
- File: `tests/config.token.test.ts`

## Rationale
Prevents regressions if precedence logic changes (e.g., using nullish coalescing instead of logical OR).
