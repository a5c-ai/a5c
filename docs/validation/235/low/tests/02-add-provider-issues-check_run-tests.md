# [Validator] [Tests] - Add tests for provider adapter on issue/check_run

### Context

The PR adds fixtures and extends tests for normalization via `handleNormalize` (which uses `normalizeGithub`). The provider adapter `GitHubProvider` in `src/providers/github/map.ts` also implements normalization. Currently there are no direct tests asserting `issue` and `check_run` mapping via the provider adapter.

### Suggested additions

- Add unit tests that call `GitHubProvider.normalize(payload)` for:
  - `tests/fixtures/github/issue.opened.json`
  - `tests/fixtures/github/check_run.completed.json`
    and assert `type`, `id`, `occurred_at`, `repo.full_name`, and `ref` shape (for check_run, `ref.sha` and `ref.name`).

### Priority

low priority

### Notes

Improves parity coverage between normalize function and provider adapter.
