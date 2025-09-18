# CI Fix: Flaky detector PR comment quoting

## Context

- Failed workflow: Tests
- Workflow file: .github/workflows/tests.yml
- Failure URL: https://github.com/a5c-ai/events/actions/runs/17839430470
- Head SHA: 1c560eabd15de72fdb16b08784a66b2d4cd5ce20

## Problem

The "Flaky tests detection" step used `node -e '...'` with single-quoted inline JS that also contained single quotes. This broke shell quoting, leading to a truncated Node script and errors like:

- SyntaxError: Unexpected token ')'
- gh api -X PATCH -H Accept:: No such file or directory

## Fix

- Move the inline Node code into a dedicated script: scripts/flaky-pr-comment.cjs
- Update Tests workflow to run the script directly.
- Keep behavior identical: upsert PR comment with marker and ensure `flaky-test` label.

## Verification

- Local static validation of YAML and script.
- CI should no longer fail on the flaky detection step; other steps unchanged.
