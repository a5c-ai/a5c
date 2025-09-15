# ⏱️ Long step hotspot annotations – Work Log

## Context

Issue: #364 – Annotate long-running CI steps with annotations and p95 summary.

## Plan

- Create composite action `.github/actions/step-hotspots` to collect step timings via GitHub API and compute p95.
- Emit ::warning/::error annotations for slow steps based on thresholds.
- Append p95 and top slow steps table to `$GITHUB_STEP_SUMMARY`.
- Wire the action into `tests.yml` and `main.yml` as final steps.

## Notes

- Uses `gh api --paginate` and the run/job/steps timing metadata.
- Thresholds configurable via inputs; defaults conservative.
