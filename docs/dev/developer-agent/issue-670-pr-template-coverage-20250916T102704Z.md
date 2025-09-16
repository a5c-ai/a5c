# Work Log — Issue #670 — Enhance PR template with CI/coverage checklist

## Context

Issue #670 requests adding a short checklist to `.github/PULL_REQUEST_TEMPLATE.md` to confirm CI (lint/typecheck/tests), acknowledge coverage impact, and ensure conventional commit titles.

## Plan

1. Update PR template with three checks:
   - Lint/typecheck/tests pass locally
   - Coverage does not regress significantly (link docs)
   - Conventional commit title
2. Create `docs/ci/coverage.md` with brief guidance and pointers to thresholds and how to run.
3. Open PR against `a5c/main`, link issue, add labels.

## Notes

- Keep checklist concise; dedupe existing entries.
- Preserve existing links to `docs/ci/ci-checks.md`.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
