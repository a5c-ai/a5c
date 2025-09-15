# Observability Collector (Composite Action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

## Usage

```yaml
- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  with:
    node-version: 20 # optional, default 20
  env:
    OBS_FILE: observability.json
    CONCLUSION: ${{ job.status }}
```

Notes:
- Node is ensured inside the composite using `actions/setup-node@v4` (default: 20, with npm cache). Override via `with.node-version` if needed.
