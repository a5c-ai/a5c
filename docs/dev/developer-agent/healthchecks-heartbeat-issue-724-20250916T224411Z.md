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

## Implementation Notes

- Added guarded steps in `.github/workflows/a5c.yml` for start and completion pings, checking `env.HEALTHCHECKS_A5C_SCHEDULE_PING_URL` in `if:`.
- Injected secret into top-level `env` to allow `if:` access.
- Added `docs/ci/alerts.md` runbook with setup/troubleshooting.
- Validated with `actionlint`; unrelated repo warnings exist but heartbeat steps conform.

## Next

- Mark PR ready for review and request validation.
