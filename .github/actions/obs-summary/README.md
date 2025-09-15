# Obs Summary & Artifact (Composite Action)

Aggregates basic job metadata with optional coverage and cache metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

## Usage

```yaml
- name: Observability summary
  uses: ./.github/actions/obs-summary
  env:
    OBS_FILE: observability.json # optional
    # Optional cache inputs (example: setup-node cache hit)
    # From actions/setup-node@v4 with id: setup-node
    # Boolean-like strings supported: true/1/yes/y
    CACHE_NODE_HIT: ${{ steps.setup-node.outputs.cache-hit }}
    # Optional job conclusion (e.g., pass through from job.status)
    CONCLUSION: ${{ job.status }}
    # Optional overrides
    JOB_NAME: ${{ github.job }}
    WORKFLOW_NAME: ${{ github.workflow }}
    RUN_ID: ${{ github.run_id }}
    RUN_ATTEMPT: ${{ github.run_attempt }}
    REPO: ${{ github.repository }}
    SHA: ${{ github.sha }}
    BRANCH_REF: ${{ github.ref }}
    # Optional; used for duration computation
    RUN_STARTED_AT: ${{ github.run_started_at }}
```

Notes:

- The action reads `coverage/coverage-summary.json` if present to include coverage metrics.
- If any environment variables beginning with `CACHE_` are present, they are parsed and included under `metrics.cache` of `observability.json` and summarized in the job step summary.
- Supported name patterns:
  - `CACHE_<KIND>_HIT`: boolean ("true"/"1"/"yes"/"y")
  - `CACHE_<KIND>_MISS`: boolean
  - `CACHE_<KIND>_KEY`: string (cache key used)
  - `CACHE_<KIND>_PRIMARY`: string (primary key)
  - `CACHE_<KIND>_RESTORED`: boolean
  - `CACHE_<KIND>_SAVED`: boolean
- When `RUN_STARTED_AT` is provided, `observability.json` will include `run.started_at` and compute `run.duration_ms` from start to completion; otherwise the action will use its own start time as a fallback.

JSON shape excerpt:

```jsonc
{
  "metrics": {
    "coverage": {
      /* existing */
    },
    "cache": {
      "entries": [{ "kind": "node", "hit": true, "key": "npm-cache-..." }],
      "summary": {
        "hits": 1,
        "misses": 0,
        "total": 1,
        "bytes_restored_total": 123456
      }
    }
  }
}
```

Additional supported boolean-like values for cache flags: "true", "1", "yes", "y".
