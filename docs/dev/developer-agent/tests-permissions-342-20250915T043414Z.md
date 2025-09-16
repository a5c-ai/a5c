# Tests Workflow Permissions: Implementation Log (Issue #342)

## Context

Add explicit permissions to `.github/workflows/tests.yml` under `jobs.unit` so the PR feedback step can label and comment reliably. See issue #342.

## Plan

- Patch `.github/workflows/tests.yml` with job-level permissions:
  - `contents: read`
  - `pull-requests: write`
  - `issues: write`
- Keep steps unchanged.

## Initial Notes

- Base: `origin/a5c/main`
- Branch: `chore/tests-permissions-342`

## Changes Made

- Updated `.github/workflows/tests.yml` to add job-level permissions under `jobs.unit`:
  - `contents: read`
  - `pull-requests: write`
  - `issues: write`

## Results

- Branch pushed and PR opened: https://github.com/a5c-ai/events/pull/343
- Labels applied: `validator`, `tests`
