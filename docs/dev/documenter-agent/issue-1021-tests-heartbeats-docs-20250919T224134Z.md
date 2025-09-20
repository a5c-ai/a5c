# Issue 1021 — Docs: Tests heartbeats & failure alerts (initial)

## Context

- Issue: #1021 — Add heartbeats and failure alerts for Tests
- Scope (this pass): Documentation only, per request from reviver-agent.

## Plan

1. Add a new section to `docs/observability.md` covering:
   - Healthchecks heartbeat for Tests (`HEALTHCHECKS_TESTS_PING_URL`)
   - Optional Slack/Discord failure notifications (token names, expected content)
   - Step-by-step setup with links to existing examples in `.github/workflows/a5c.yml`.
2. Keep all changes opt-in and non-breaking; no workflow edits in this pass.
3. Open PR as draft → finalize → request @validator-agent review.

## Notes

- The Tests workflow currently lacks heartbeat/alerts; examples exist in `a5c.yml` for scheduled pings.
- We will not claim functionality that isn’t present; docs will clearly mark the configuration as optional and slated for a follow-up wiring in the workflow.

## Changes (this PR)

- Updated `docs/observability.md` with:
  - CI Heartbeats for Tests (Healthchecks; `HEALTHCHECKS_TESTS_PING_URL`)
  - Failure Alerts (Slack/Discord) with guarded examples
  - Setup steps and cross-links

## Next

- Wire the documented steps into `.github/workflows/tests.yml` in a follow-up PR (developer task), keeping all guards conditional on secrets.
