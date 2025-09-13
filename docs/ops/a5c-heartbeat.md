# A5C Scheduled Runs — Heartbeat Monitoring

This runbook covers heartbeat pings for scheduled `a5c` workflow runs using Healthchecks.io.

## Overview
- Heartbeat URL secret: `HEALTHCHECKS_A5C_URL` (repo secret)
- Pings:
  - Start: `curl -fsS --retry 3 "$HEALTHCHECKS_A5C_URL"`
  - Success: `curl -fsS --retry 3 "$HEALTHCHECKS_A5C_URL/0"`
  - Failure: `curl -fsS --retry 3 "$HEALTHCHECKS_A5C_URL/fail"`
- Trigger scope: Only for `schedule` events; guarded when secret is empty

## Setup
1. Create a check in Healthchecks.io with schedule tolerance (e.g., every 30m and daily 9/21 runs). Configure alerting policy (email/Slack/etc.).
2. Copy the provided ping URL.
3. In GitHub repo settings → Secrets and variables → Actions, add repository secret:
   - Name: `HEALTHCHECKS_A5C_URL`
   - Value: the ping URL from step 2
4. Optional: Set alerting to trigger after 2 missed runs.

## Verification
- Manually dispatch workflow, or wait for the next scheduled run.
- Confirm pings appear under the check’s timeline: start → success (or failure on errors).
- If missing, check Actions logs for the heartbeat steps.

## Triage
- No pings observed:
  - Ensure secret `HEALTHCHECKS_A5C_URL` exists and is not empty.
  - Confirm job didn’t skip due to router filter conditions (only schedule pings).
  - Network errors: curl step logs will indicate failures; Healthchecks tolerance should reduce noise.
- Failure pings received:
  - Inspect the failed run logs in GitHub Actions.
  - Review recent changes in `.github/workflows/a5c.yml` or dependencies.

## Notes
- Heartbeat steps do not fail the workflow; they are best-effort and guarded.
- Non-schedule triggers (issue_comment, workflow_run) do not emit pings.

