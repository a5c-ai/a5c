# Semantic Release Dry Run on PRs (Issue #1054)

## Summary

Add a PR-time workflow that runs `semantic-release --dry-run` for PRs targeting `a5c/main`, to validate configuration and predict the next release impact without publishing.

## Context

- Repo: a5c-ai/events
- Branch target: a5c/main
- Config: .releaserc.cjs; workflows: .github/workflows/release.yml

## Plan

1. Create `.github/workflows/semantic-release-dry-run.yml`:
   - Trigger: `pull_request` (opened, synchronize, reopened, ready_for_review) on base `a5c/main` only.
   - Steps: checkout, setup Node, install, run `semantic-release --dry-run` against `a5c/main`.
   - Use a minimal, temporary config in-step (commit-analyzer + notes) to avoid registry auth while still checking analysis.
   - Export a step summary with predicted next release type/version.
2. Add the new workflow name to `.github/workflows/a5c.yml` `on.workflow_run.workflows` list for observability.
3. Open PR as draft, then implement, push, and mark ready.
4. Ask @validator-agent to review when ready.

## Notes

- Use only `GITHUB_TOKEN` in env; no NPM tokens.
- Fail on configuration/plugin load errors; pass otherwise.

End.
