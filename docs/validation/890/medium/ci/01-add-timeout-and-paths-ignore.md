# [Validator] [CI] - Add timeout and paths-ignore for CodeQL

### Context

PR: https://github.com/a5c-ai/events/pull/890

The new `.github/workflows/codeql.yml` is correct and working. To reduce accidental long-running jobs and avoid triggering on docs-only changes, add the following non-blocking improvements.

### Recommendations

- Add a job-level timeout to prevent hanging runs:
  - Under `jobs.analyze`, add `timeout-minutes: 60` (or a value aligned with your SLA).
- Reduce needless triggers on content-only changes:
  - Under `on.push` and `on.pull_request`, add `paths-ignore` with common non-code patterns, e.g.:
    ```yaml
    paths-ignore:
      - "**/*.md"
      - "docs/**"
      - ".github/ISSUE_TEMPLATE/**"
    ```

### Priority

medium priority

### Rationale

These changes optimize CI usage and developer feedback loop without altering security coverage.
