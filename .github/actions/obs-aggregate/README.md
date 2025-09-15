# Observability Aggregate (composite action)

Downloads `observability` artifacts emitted by prior jobs (e.g., via `.github/actions/obs-summary`) and aggregates them into `observability.aggregate.json` at the workspace root.

- Inputs: none (auto-discovers artifacts named `observability`)
- Outputs: uploads `observability-aggregate` artifact and writes `observability.aggregate.json`
- Aggregation:
  - Cache: concatenates `metrics.cache.entries` and computes `hits`, `misses`, `total`, and `bytes_restored_total`.
  - Coverage: preserved per job within `jobs[]` (no cross-job merge).
