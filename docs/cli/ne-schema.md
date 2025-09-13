---
title: NE Schema Overview
description: Overview of the Normalized Event schema used by the Events SDK/CLI.
---

# Normalized Event (NE) Schema — Overview

The NE schema provides a consistent shape across providers for downstream agents and automations.

## Top-level fields (MVP)
- `type`: normalized event type (e.g., `workflow_run`, `pull_request`, `push`)
- `source`: provider (e.g., `github`)
- `repo`: `{ id, full_name, default_branch, visibility }`
- `actor`: `{ id, login, type }`
- `timestamps`: `{ observed, provider, received }`
- `provenance`: `{ workflow: { name, run_id, attempt }, run: { id } }`
- `labels`: `string[]` used for routing and filtering (e.g., `env=staging`)
- `payload`: selected/raw fields needed downstream (curated)
- `enriched`: provider-specific derived data (e.g., `github.pr`, `commits`, `diff`, `mentions`)
- `composed`: optional derived events emitted by rules

## Mentions
Mentions are extracted from commit messages, PR/Issue title/body, comments, and code comments (language-aware) as per specs. Each mention includes a `source` and short `context` snippet.

## JSON Schema location
A canonical JSON Schema will live at:
- `docs/specs/ne.schema.json` (planned)

Validation examples (when schema is added):
```bash
# Using ajv-cli (example)
ajv validate -s docs/specs/ne.schema.json -d out.json
```

## References
- Project specs: `docs/specs/README.md`
- BDD acceptance outlines in specs
