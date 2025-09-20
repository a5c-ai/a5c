# PR Size Labels: Pagination Implementation Plan

## Context

Issue: https://github.com/a5c-ai/events/issues/1079
File: `.github/workflows/pr-size-labels.yml`

## Problem

Large PRs (>100 files) undercount changes because `pulls.listFiles` was not paginated.

## Plan

- Replace action-based labeler with `actions/github-script` step.
- Use `github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number, per_page: 100 })`.
- Sum additions+deletions across all files.
- Upsert labels remains as-is.
- Ensure only one `size:*` label is present.
- Validate via actionlint and CI.

## Thresholds

- XS: < 10
- S: < 50
- M: < 200
- L: < 500
- XL: ≥ 500
