# Build Fix: obs-aggregate upload path + flaky-detector robustness

- Context run: https://github.com/a5c-ai/events/actions/runs/17742820757
- Failures observed:
  - Unit job: Flaky detector step tripped on quoting (non-blocking with continue-on-error)
  - Aggregate job: obs-aggregate composite action failed with `ReferenceError: number is not defined` (fixed already) and `Input required and not supplied: path`

## Plan

- Keep corrected typeof check in obs-aggregate (`'number'` string)
- Make upload-artifact path static (`observability.aggregate.json`) instead of `${{ env.OUT_FILE }}` which is unavailable at expression time in composite
- Open PR to a5c/main with build+bug labels, link failing run

## Notes

- Verified unit tests pass locally; coverage artifacts are produced.
