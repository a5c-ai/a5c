# 📄 Work Log: Issue #1021 – Tests heartbeats + failure alerts

## Plan
- Add optional Healthchecks ping steps to `.github/workflows/tests.yml` guarded by `HEALTHCHECKS_TESTS_PING_URL`.
- Add optional Slack/Discord failure notifications guarded by existing secrets/vars.
- Update `docs/observability.md` with exact env names and setup steps.

## Notes
- Follow existing heartbeat pattern in `.github/workflows/a5c.yml`.
- Keep all steps conditional to avoid noise on forks.
