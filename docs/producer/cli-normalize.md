# CLI: Normalize and Validate

This page shows how to read GitHub payloads and print Normalized Event (NE) JSON, and validate it against the NE schema.

## Quick Start

- Normalize a `workflow_run` payload from file and validate:

```bash
# Normalize (assumes `events` CLI available)
events normalize --in samples/workflow_run.completed.json > out.json

# Validate using ajv-cli (example)
npx ajv validate -s docs/specs/ne.schema.json -d out.json
```

- Normalize the current GitHub Actions run (inside Actions):

```bash
npx @a5c-ai/events normalize --source actions > event.json
jq '.repo.full_name, .type, .provenance.workflow?.name' event.json
```

## Input Sources

- `--in file.json`: path to a raw webhook payload
- `--source actions`: read from Actions runtime env and `GITHUB_EVENT_PATH`.
  Note: the CLI accepts `actions` as an input alias and normalizes the stored
  value to `provenance.source: "action"` to match the NE schema
  (`docs/specs/ne.schema.json`).

## Output Control

- `--select`: pick fields to print
- `--label key=value`: add labels to `labels[]`

## Examples

- Pull Request event normalization:

```bash
events normalize --in samples/pull_request.synchronize.json | jq '.type, .ref.head'
```

- Push event normalization:

```bash
events normalize --in samples/push.json | jq '.ref.name, .ref.type, .ref.sha'
```

## Tests and Fixtures

- Place sample payloads under `samples/` (e.g., `workflow_run.completed.json`, `pull_request.synchronize.json`, `push.json`, `issue_comment.created.json`).
- Unit tests should:
  - Map fields per this doc
  - Validate output against `docs/specs/ne.schema.json`
  - Cover at least 3 event types
