# Build Fix: Quick Checks docs-lint ripgrep apt-get timeout

Started: 2025-09-19T19:22:00Z

## Context

- Failed workflow run: Quick Checks (workflow_run → pull_request) on branch `a5c/main`.
- Logs show `Docs Lint (banned phrases) / Ensure ripgrep is installed` timed out at 2 minutes while running `apt-get install ripgrep` and processing triggers (man-db/needrestart), then canceled.

## Root Cause (infra)

`docs-lint` job has `timeout-minutes: 2` and attempts to install ripgrep via apt when `rg` is missing. On ubuntu-24.04 runners this may take ~2 minutes due to apt triggers, causing cancellation.

## Plan

1. Remove the explicit apt install step.
2. Use `rg` if present; otherwise fallback to `grep -R` to scan markdown files.
3. Keep the job fast and deterministic under the 2-minute budget.
4. Open PR with analysis and link to failing run.

## Verification Steps

- Ensure the new step exits non-zero if banned phrase is found.
- Ensure it only scans README.md and docs/\*_/_.md (markdown files).

## Progress

- Implemented workflow change to remove apt install and add rg-or-grep fallback.
- Opened PR: https://github.com/a5c-ai/events/pull/1012 (auto-merge enabled, squash).

## Links

- Failed run to address: https://github.com/a5c-ai/events/actions/runs/17867730945
