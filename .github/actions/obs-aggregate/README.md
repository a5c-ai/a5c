# obs-aggregate (composite action)

Aggregates artifacts from the current workflow run and emits a step summary plus a JSON file with lightweight metrics. Designed to be resilient (no-op when artifacts are missing).

## Inputs
- `obs_file` (default: `observability-aggregated.json`) — output JSON file path

## Outputs
None.

## Example
```yaml
- name: Aggregate Observability
  uses: ./.github/actions/obs-aggregate
  with:
    obs_file: observability.json
```
