# [Validator] [Tests] - Upload coverage-summary.json artifact

Priority: medium

## Context

- PR #331 introduces a composite action that optionally reads `coverage/coverage-summary.json` to enrich the observability summary and JSON.
- Current workflow uploads `coverage/lcov.info` but not `coverage/coverage-summary.json`.

## Recommendation

- Extend `.github/workflows/tests.yml` artifact upload to include `coverage/coverage-summary.json` alongside `lcov.info`.
- This enables downstream tools (including the composite action and any external dashboards) to consume coverage totals without recomputing from LCOV.

## Example

```yaml
- name: Upload coverage artifacts
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: |
      coverage/lcov.info
      coverage/coverage-summary.json
```

## Rationale

- Aligns with `vitest` reporters (`json-summary` already enabled) and avoids duplication of parsing logic.
- Improves feedback-loop by making totals accessible to CI, bots, and reports.
