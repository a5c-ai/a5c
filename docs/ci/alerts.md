# CI Heartbeat Alerts (Healthchecks.io)

This repository can optionally send heartbeat pings for scheduled agent runs to Healthchecks.io (or a compatible self-hosted instance). This helps detect silent failures or stalls when scheduled workflows don’t run or hang unexpectedly.

## What it does

- On `schedule` events only, the a5c workflow pings a Healthchecks URL:
  - At job start: `GET <PING_URL>/start`
  - At completion:
    - success: `GET <PING_URL>`
    - failure: `GET <PING_URL>/fail`
    - cancelled: `GET <PING_URL>/cancel`
- Pings are fully guarded and only happen when the secret is configured.

## Configure

1. Create a check in Healthchecks.io and copy the provided ping URL (looks like `https://hc-ping.com/<uuid>`).
2. Add a repository secret named `HEALTHCHECKS_A5C_SCHEDULE_PING_URL` with the ping URL value.
3. Nothing else is required: the workflow conditionally pings only on `schedule` runs.

## Notes

- Network errors in pings are tolerated and do not fail the job.
- If the secret is not set, there is no behavior change.
- For self-hosted Healthchecks, use your instance base URL in place of `hc-ping.com`.

## Troubleshooting

- Verify the workflow actually runs via the repository’s “Actions” tab and that the run was triggered by `schedule` (cron).
- Confirm the secret name matches exactly: `HEALTHCHECKS_A5C_SCHEDULE_PING_URL`.
- Check the Healthchecks dashboard for received pings and status.
