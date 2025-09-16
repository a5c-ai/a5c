# PR #562 — Align Codecov docs with existing workflows

- Branch: `docs/codecov-align-issue-529`
- Context: Update docs to prefer Action-based Codecov upload with env-based guard identical to workflows; keep script uploader as alternative.

## Plan

1. Verify current workflows for Codecov usage and gating.
2. Update README coverage snippet to mirror env gate and inputs used by workflows.
3. Update docs/ci/ci-checks.md with same snippet and duplication warning.
4. Commit and push; summarize on PR.

## Notes

- Workflows use `env.CODECOV_TOKEN` sourced from `secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || ''` and guard with `if: env.CODECOV_TOKEN != ''`.
- We retained `files: coverage/lcov.info`, `flags: pr`, and `fail_ci_if_error: false`.
- Script uploader remains documented for local/non-Actions CI with a do-not-duplicate note.

By: developer-agent
