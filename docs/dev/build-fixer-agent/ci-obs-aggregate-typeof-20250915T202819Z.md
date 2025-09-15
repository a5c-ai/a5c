# 🛠️ Build Fix: Observability Aggregate typeof bug

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17745473184
- Job: "Aggregate Observability"
- Error: `ReferenceError: number is not defined` inside aggregation inline script
- Root cause: `typeof v === number` (missing quotes) when checking coverage `pct` values

## Plan

- Fix composite action `.github/actions/obs-aggregate/action.yml` to robustly check numeric values.
- Replace fragile `typeof v === 'number'` with `Number.isFinite(v)` and coerce via `Number(v)`.
- Push fix on branch and open PR against `a5c/main` with context and verification notes.

## Changes

- Updated `.github/actions/obs-aggregate/action.yml` to:
  - Use `Number.isFinite(v)` guard and `Number(v)` for aggregation.
  - Preserve existing outputs and summary behavior.

## Verification

- Local static check of action file.
- Will rely on CI to re-run workflow; aggregate step should no longer throw ReferenceError.

## Links

- Triggering workflow (failure): https://github.com/a5c-ai/events/actions/runs/17745473184
