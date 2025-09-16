# [Validator] Unknown permission scope `models`

The `permissions` block in `.github/workflows/a5c.yml` contains `models: read`, which is not a recognized GitHub Actions permission scope. actionlint flags it as unknown.

- Impact: Low (non-blocking). Workflow likely ignores this scope.
- Suggestion: Remove `models` or replace with a valid scope. If intended for future GitHub features, consider commenting it out or documenting it.

Context: `.github/workflows/a5c.yml`
