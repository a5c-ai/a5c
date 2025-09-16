# [Validator] Tests – Add explicit test for PR title mentions

### Summary

Mentions extraction includes PR title (`'pr_title'`) but we lack a direct test covering it. Existing tests cover commit messages and PR body.

### Recommendation

- Add a test case under `tests/` that feeds a sample event with a PR title containing an agent mention and asserts extraction includes a `source: 'pr_title'` item.

### Acceptance

- New unit test passes and increases coverage for mentions sources.
