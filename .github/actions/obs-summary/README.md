Aggregates basic job metadata with optional coverage and cache metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

Usage:

```yaml
    - name: Observability summary
      uses: ./.github/actions/obs-summary
      env:
        OBS_FILE: observability.json # optional
        # Optional cache inputs (example: setup-node cache hit)
        CACHE_NODE_HIT: ${{ steps.setup-node.outputs.cache-hit }}
        CACHE_NODE_KIND: node
```

Notes:
- The action reads `coverage/coverage-summary.json` if present to include coverage metrics.
- If cache envs are provided (any `CACHE_<KIND>_HIT`), `observability.json` will include a `metrics.cache` section:

```
{
  "metrics": {
    "cache": {
      "entries": [
        { "kind": "node", "hit": true }
      ],
      "summary": { "hits": 1, "misses": 0, "total": 1 }
    }
  }
}
```

The job summary will append a line like:

```
- Cache: 1/1 hits (node: hit)
```
