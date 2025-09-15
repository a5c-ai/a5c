# Obs Summary & Artifact (Composite Action)

Aggregates basic job metadata with optional coverage and cache metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

> Prerequisite: This composite executes Node.js inline scripts (via `node -e`). Ensure Node is available in the job. We recommend `actions/setup-node@v4` with Node 20.

## Usage

```yaml
# Ensure Node is available (required for this composite)
- name: Setup Node.js
  id: setup-node
  uses: actions/setup-node@v4
  with:
    node-version: 20

- name: Observability summary
  uses: ./.github/actions/obs-summary
  with:
    node-version: 20 # optional, default 20
  env:
    OBS_FILE: observability.json # optional
    VALIDATE_OBS_SCHEMA: "true" # optional, warn-only validation
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
- Node setup is performed inside the composite using `actions/setup-node@v4` with a default version of `20` and npm cache. Override via `with.node-version` if needed, or run your own setup-node before this action.
- If cache envs are provided (any `CACHE_<KIND>_HIT`), `observability.json` will include a `metrics.cache` section and the step summary will include a cache line.
- Supported cache env name patterns (current implementation):
  - `CACHE_<KIND>_HIT`: boolean ("true"/"1"/"yes"/"y")
  - `CACHE_<KIND>_BYTES`: number (bytes restored)
  - `CACHE_<KIND>_KEY`: string (cache key used)
- If `CACHE_<KIND>_BYTES` is provided, per-entry `bytes` and a `bytes_restored_total` summary are included.
- When `RUN_STARTED_AT` is provided, `observability.json` will include `run.started_at` and compute `run.duration_ms` from start to completion; otherwise the action will use its own start time as a fallback.
- The artifact includes `schema_version: "0.1"` and can be validated against `docs/specs/observability.schema.json`.

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
        "bytes_restored_total": 123456,
      },
    },
  },
}
```

Additional supported boolean-like values for cache flags: "true", "1", "yes", "y".
