# CI build fix: obs-summary sed robustness

## Context

- Failing workflow: Tests (run https://github.com/a5c-ai/events/actions/runs/17739615365)
- Symptom: Observability summary step errors with `sed: unknown command: '('` on Ubuntu 24.04 runner; job marked failure even though tests passed.
- Root cause: Use of `sed -E` with extended regex and `\L` lowercasing in composite action; runner's sed rejects the expression.

## Plan

- Replace sed pipeline with portable awk to extract and lowercase cache kinds.
- Verify composite action locally by simulating envs and running tests.
- Open PR with fix, link failing run, and mark ready for review.

## Changes

- .github/actions/obs-summary/action.yml: use `awk -F"[=_]" ... tolower($2)` instead of sed pipeline.

## Verification

- Local: npm ci, build, test pass; composite action parsing simulated env works.
- CI: Tests workflow should reach Observability summary without sed error.
