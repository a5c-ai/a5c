# Obs Summary & Artifact (Composite Action)

Aggregates basic job metadata with optional coverage and cache metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

## Usage

```yaml
- name: Observability summary
  uses: ./.github/actions/obs-summary
  env:
    OBS_FILE: observability.json # optional
    # Optional cache inputs (example: setup-node cache hit)
    CACHE_NODE_HIT: ${{ steps.setup-node.outputs.cache-hit }}
    # Optional job conclusion (e.g., pass through from job.status)
    CONCLUSION: ${{ job.status }}
    # Optional job name override
    JOB_NAME: ${{ github.job }} # optional override
```

Notes:

- The action reads `coverage/coverage-summary.json` if present to include coverage metrics.
- If cache envs are provided (any `CACHE_<KIND>_HIT`), `observability.json` will include a `metrics.cache` section and the step summary will include a cache line.
