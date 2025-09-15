# Build Fix: Observability summary failure (HIT not defined)

- Context: workflow_run failure on a5c/main, run 17725478161
- Symptom: Observability summary step fails with `ReferenceError: HIT is not defined`
- Root cause: inline Node eval in composite action parsed CACHE\_\* fields but compared against bare identifiers (`HIT`, `BYTES`, `KEY`) in the executed environment.
- Category: Build Infrastructure (Category 2)

## Plan

- Harden `./.github/actions/obs-summary/action.yml` Node snippet.
- Define constants for `HIT/BYTES/KEY` and use them in comparisons.
- Preserve duration and cache metrics reporting.
- Open PR targeting `a5c/main`, link to failed run, add labels build+bug+high priority.

## References

- Failed run: https://github.com/a5c-ai/events/actions/runs/17725478161
