# Healthchecks heartbeat for scheduled runs (issue #724)

## Plan

- Guarded pings using `secrets.HEALTHCHECKS_A5C_SCHEDULE_PING_URL`
- Only for `schedule` events
- `start` ping at job begin
- `success` or `fail` ping at end
- Add docs: `docs/ci/alerts.md`

## Context

Workflow file: `.github/workflows/a5c.yml`

## TODO

- Implement steps
- Validate with `./actionlint`
