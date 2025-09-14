---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE) and can enrich with repository context. Implemented with `commander` (see `src/cli.ts`).

## Commands

### `events mentions`
Extract `@mentions` from text.

Usage:
```bash
events mentions [--file FILE] [--source <kind>] [--window N] [--known-agent NAME...]
```

- `--file FILE`: optional path to read text; defaults to stdin
- `--source <kind>`: where text came from, e.g. `pr_body`, `pr_title`, `commit_message` (default: `pr_body`)
- `--window N`: context window size for excerpts (default: 30)
- `--known-agent NAME...`: known agent names to boost confidence

Example:
```bash
events mentions --file README.md --source pr_body --known-agent developer-agent validator-agent
```

### `events normalize`
Normalize a raw provider payload into the NE schema.

Usage:
```bash
events normalize [--in FILE] [--out FILE] [--source <actions|webhook|cli>] \
  [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
```

- `--in FILE`: path to a JSON webhook payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--source <name>`: provenance source (default: `cli`)
- `--label KEY=VAL...`: attach labels (repeatable as `--label a=1 --label b=2`)
- `--select PATHS`: comma-separated dot paths to include in output (e.g., `type,repo.full_name`)
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits code `2` with no output

Examples:
```bash
# Select a few fields
events normalize --in samples/workflow_run.completed.json \
  --select 'type,repo.full_name,provenance.workflow.name'

# Gate output via filter (exit 2 if not matched)
events normalize --in samples/workflow_run.completed.json --filter 'type=workflow_run'
```

### `events enrich`
Enrich a normalized event (or raw GitHub payload) with repository and provider metadata.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
```

- `--in FILE`: input JSON (normalized event or raw GitHub payload)
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: path to rules file (YAML/JSON) recorded in `enriched.metadata.rules`
- `--flag KEY=VAL...`: enrichment flags map recorded in `enriched.derived.flags`
  - Recognized flags include:
    - `include_patch=true|false` (default false) – include diff patches; when false, patches are removed
    - `commit_limit=<n>` (default 50) – limit commits fetched for PR/push
    - `file_limit=<n>` (default 200) – limit files per compare list
    - `use_github=true|false` – enable GitHub API enrichment (also enabled via `--use-github`)
- `--use-github`: convenience to set `use_github=true` (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: labels to attach
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits code `2` with no output

Examples:
```bash
export GITHUB_TOKEN=...  # required for GitHub API lookups

events enrich --in samples/pull_request.synchronize.json --use-github \
  --flag include_patch=false --flag commit_limit=30 --out out.json
jq '.enriched.github.pr.has_conflicts, .enriched.github.pr.mergeable_state' out.json
```

## Global Options
- `--help`: show command help
- `--version`: print version

## Exit Codes
- `0`: success
- Non-zero: errors (input/validation/provider). The CLI exits with the handler code.

## Security and Redaction
- Secrets: known patterns are redacted in output and logs by default; see `src/utils/redact.ts`.
- Tokens: set `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN` for GitHub enrichment (precedence: `A5C_AGENT_GITHUB_TOKEN` then `GITHUB_TOKEN`); tokens are never printed.

## Cross-References
- Specs: `docs/specs/README.md`
- Samples: `samples/`
- Tests: `test/` (unit), `tests/` (integration)
