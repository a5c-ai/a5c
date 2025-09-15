# Obs Summary & Artifact (Composite Action)

Aggregates basic job metadata with optional coverage and cache metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

## Usage

```yaml
- name: Observability summary
  uses: ./.github/actions/obs-summary
  with:
    node-version: 20 # optional, default 20
  env:
    OBS_FILE: observability.json # optional
    # Optional cache inputs (example: setup-node cache hit)
    CACHE_NODE_HIT: ${{ steps.setup-node.outputs["cache-hit"] }}
    # Optional size and key (best-effort; parse logs and set these)
    CACHE_NODE_BYTES: ${{ env.CACHE_NODE_BYTES }}
    CACHE_NODE_KEY: ${{ env.CACHE_NODE_KEY }}
    # Optional job conclusion (e.g., pass through from job.status)
    CONCLUSION: ${{ job.status }}
    # Optional job name override
    JOB_NAME: ${{ github.job }} # optional override
    WORKFLOW_NAME: ${{ github.workflow }} # optional
    RUN_ID: ${{ github.run_id }} # optional
    RUN_ATTEMPT: ${{ github.run_attempt }} # optional
    REPO: ${{ github.repository }} # optional
    SHA: ${{ github.sha }} # optional
    BRANCH_REF: ${{ github.ref }} # optional
    RUN_STARTED_AT: ${{ github.run_started_at }} # optional; used for duration
```

Notes:

- The action reads `coverage/coverage-summary.json` if present to include coverage metrics.
- The action sets up Node.js using `actions/setup-node@v4` with a default version of `20`. Override via `with.node-version` if needed.
- If cache envs are provided (any `CACHE_<KIND>_HIT`), `observability.json` will include a `metrics.cache` section and the step summary will include a cache line.
- If `CACHE_<KIND>_BYTES` is provided, per-entry `bytes` and a `bytes_restored_total` summary are included.
- When `RUN_STARTED_AT` is provided, `observability.json` will include `run.started_at` and compute `run.duration_ms` from start to completion; otherwise the action will use its own start time as a fallback.
