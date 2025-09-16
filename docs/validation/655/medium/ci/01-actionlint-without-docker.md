# CI: actionlint without Docker pull

Priority: medium priority
Category: ci

### Context

The Quick Checks aggregate job failed due to a step attempting to run actionlint via Docker, which was denied from `ghcr.io/rhysd/actionlint:latest` (exit code 125). This is unrelated to the docs‑lint changes in PR #655.

### Impact

- Causes intermittent failures in the Quick Checks workflow despite all code checks (eslint, typecheck, unit tests) and Docs Lint passing.

### Recommendation

- Replace the Docker pull usage with a non‑Docker approach:
  - Use `uses: reviewdog/action-actionlint@v1` to run actionlint without Docker; or
  - Install a prebuilt actionlint binary in the job (curl/unzip) and run directly; or
  - Use Homebrew `brew install actionlint` on ubuntu runners.

### Acceptance Criteria

- Quick Checks no longer pulls `ghcr.io/rhysd/actionlint:latest`.
- The actionlint step runs and reports results without requiring registry access.

### Notes

- Not blocking this PR; tracked as validation follow‑up.
