---
title: NE Schema Overview
description: Overview of the Normalized Event schema used by the Events SDK/CLI.
---

# Normalized Event (NE) Schema — Overview

The NE schema provides a consistent shape across providers for downstream agents and automations.

## Top-level fields (MVP)

- `type`: normalized event type (e.g., `workflow_run`, `pull_request`, `push`)
- `provider`: event source provider (e.g., `github`)
- `repo`: `{ id, full_name, visibility, ... }`
- `actor`: `{ id, login, type }`
- `occurred_at`: ISO timestamp for the event occurrence
- `provenance`: `{ source, workflow?: { name?, run_id? } }`
- `labels`: `string[]` used for routing and filtering (e.g., `env=staging`)
- `payload`: selected/raw fields needed downstream (curated)
- `enriched`: provider-specific derived data (e.g., `github.pr`, `commits`, `diff`, `mentions`)
- `composed`: optional derived events emitted by rules

## Mentions

Mentions are extracted from commit messages, PR/Issue title/body, comments, and code comments (language-aware) as per specs. Each mention includes a `source` and short `context` snippet.

## JSON Schema location

The canonical JSON Schema lives at:

- `docs/specs/ne.schema.json`

Validation example:

```bash
# Using ajv-cli (example)
ajv validate -s docs/specs/ne.schema.json -d out.json
```

## Provenance details

The canonical schema defines `provenance` as follows:

```json
{
  "provenance": {
    "source": "action | webhook | cli",
    "workflow": {
      "name": "string (optional)",
      "run_id": "integer | string (optional)"
    }
  }
}
```

Notes:

- Fields like `provenance.workflow.attempt`, `provenance.workflow.run_number`, or a top-level `provenance.run` object are NOT part of the current schema and must not appear in examples or validation snippets.
- GitHub mapping currently populates `workflow.name` and `workflow.run_id` when available; see `src/providers/github/map.ts`.

### Future extensions

- `attempt` (rerun attempt) may be added in a future minor schema revision. Until then, do not rely on it in validation or examples.

## References

- Project specs: `docs/specs/README.md`
- BDD acceptance outlines in specs
