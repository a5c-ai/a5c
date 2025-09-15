# Issue 385: Document Required Status Checks for a5c/main

## Context

Issue #385 requests documenting and confirming required status checks for a5c/main (and main).
Current workflows include Lint, Typecheck, PR Quick Tests, Commit Hygiene, Tests, Quick Checks.

## Plan

- Inventory workflow check names and triggers
- Query branch protection for a5c/main and main
- Draft docs page with proposed required checks and links

## Findings

- Branch protection API returns 404 for both a5c/main and main (not protected via API at this moment) – repo admins may have UI-only defaults or plan to configure.
- Candidate checks visible in workflows:
  - Lint (job: lint)
  - TypeScript Typecheck (job: typecheck)
  - Unit Tests (PR) (job: vitest)
  - Quick Checks (pr-fast aggregates lint/typecheck/tests)
  - Commit Hygiene (job: commit-hygiene) – PR title/conventional commits
  - Tests (push) (job: unit)

## Next

- Add docs page under docs/ci with explicit list and how to set via GitHub UI, plus JSON payload example for API.
