# CI fix: commitlint vs semantic-release notes

- Context: Release workflow failed because Husky commit-msg ran commitlint with default `body-max-line-length` and `footer-max-line-length` rules, rejecting `@semantic-release/git`'s generated release notes.
- Fix: Relax commitlint by disabling body/footer max line length limits.
- Scope: Only affects commit message linting; does not change code or release behavior.
- Why safe: Conventional Commits does not strictly require line-length limits, and release notes often include long lines. This avoids false negatives in CI.
- Links: https://github.com/a5c-ai/events/actions/runs/17738449390
