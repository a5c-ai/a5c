# [Validator] [Tests] - Quote shell variables in PR tests steps

### Context

- PR: #1077
- File: `.github/workflows/pr-tests.yml`
- Finding: `actionlint`/`shellcheck` reports warnings (SC2086, SC2046) due to unquoted variables/command substitutions in bash `run:` steps that interact with `gh` and environment variables.

### Why this matters

- Unquoted variables can lead to unintended word splitting or glob expansion if values contain spaces or special characters. While CI environments typically provide safe values, quoting improves robustness and satisfies linting.

### Examples (non-exhaustive)

- Quote expansions like `$REPO_FULL`, `$PR_NUMBER`, command substitutions `$(...)`, and test operands.
- Prefer `"$(command)"` and `"$VAR"` unless intentional splitting is required.

### Suggested Fix

- In `.github/workflows/pr-tests.yml` within the coverage feedback step, wrap variables and command substitutions in double quotes.
- Similarly quote parameters passed to `gh` CLI flags that accept values.

### Priority

- medium

### Notes

- These are warnings, not failures. Current behavior is acceptable; this is a hardening/linting improvement.
