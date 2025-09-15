# obs-aggregate (local action)

Downloads artifacts from a given workflow run (defaults to current) with names starting with `observability` and aggregates all JSON files into a single `observability-aggregate.json`.

## Inputs
- `repo` (optional): owner/repo; defaults to current repo
- `run_id` (optional): run ID; defaults to current run
- `artifact_prefix` (optional): defaults to `observability`
- `output_file` (optional): defaults to `observability-aggregate.json`
- `token` (optional): GitHub token; falls back to `GH_TOKEN`/`GITHUB_TOKEN`

## Outputs
- `file`: path to aggregated JSON
- `count`: number of items aggregated

The action is tolerant when no artifacts are present and will succeed with an empty aggregate.
