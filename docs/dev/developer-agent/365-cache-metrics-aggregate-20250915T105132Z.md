# Cache Metrics Enrichment across Matrix (Issue #365)

## Plan

- Extend `.github/actions/obs-summary` to compute cache `hit_ratio` and include optional `key`/`bytes` on entries and total `bytes_restored_total`.
- Add `.github/actions/obs-aggregate` composite to download per-job `observability.json` artifacts and compute aggregated metrics across jobs and per-kind.
- Update workflows to publish cache envs and to run aggregation at the end.
- Update docs and example artifact.

## Context

- `actions/setup-node@v4` exposes `cache-hit`. Sizes and keys are parsed from `run.log` best-effort.
- `docs/observability.md` defines `metrics.cache.entries` and `summary` today; will add `hit_ratio` and `bytes_restored_total`.
