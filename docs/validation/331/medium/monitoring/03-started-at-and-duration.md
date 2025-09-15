# [Validator] [Monitoring] - Populate started_at and duration

Priority: medium priority
Labels: validator, monitoring

## Summary

`observability.json` sets `run.started_at: null`. Populate this and include `duration_ms` for better time-based correlation.

## Rationale

Having both start and end times enables latency tracking across jobs and correlation with external systems.

## Suggested approach

- Prefer `${{ github.run_started_at }}` when available (from workflow context) by passing it via `env` into the composite action.
- Fallback: in composite, record a shell `START_TS=$(date +%s%3N)` at job start (or pass from caller), then compute duration when writing JSON.
