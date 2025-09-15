# [Validator] [Monitoring] Capture started_at and duration in observability.json

Priority: medium priority
Category: monitoring

## Context
The composite action `.github/actions/obs-summary` sets `run.started_at` to `null` and only records `completed_at`. Capturing `started_at` and a computed `duration_ms` improves trend analysis and SLO monitoring.

## Proposal
- Detect a start timestamp from earlier in the job if available (e.g., inject an env `JOB_STARTED_AT` from workflow) and fall back to `Date.now()` at action start.
- Add fields to JSON: `run.started_at` (ISO8601) and `run.duration_ms` (number).
- Append a short line to the step summary with duration.

## Acceptance Criteria
- observability.json contains both `started_at` and `duration_ms`.
- Step summary shows a human-readable duration when possible.
- Backward compatibility: no breaking changes for existing consumers.
