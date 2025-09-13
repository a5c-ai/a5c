---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`normalize`, `enrich`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE) and optionally enriches with repository context.

## Commands

### `events mentions`
Extract `@mentions` from text (stdin) or a file.

Usage:
```bash
events mentions [--file FILE] [--source KIND] [--window N] [--known-agent NAME...]
```

- `--source KIND`: mention source kind (e.g., `pr_body`, `commit_message`) [default: `pr_body`]
- `--file FILE`: read from file instead of stdin
- `--window N`: context window size around mentions [default: `30`]
- `--known-agent NAME...`: known agent names to boost confidence

Examples:
```bash
echo "Ping @developer-agent" | events mentions --source issue_comment | jq -r '.[].normalized_target'
```

### `events normalize`
Normalize a raw event payload into the NE schema.

Usage:
```bash
events normalize [--in FILE] [--out FILE] [--source NAME] [--label KEY=VAL...]
```

- `--in FILE`: path to a JSON webhook payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--source NAME`: provenance (`actions|webhook|cli`) [default: `cli`]
- `--label KEY=VAL...`: attach labels (repeatable)

Examples:
```bash
events normalize --in samples/workflow_run.completed.json | jq '.type, .repo.full_name'
```

### `events enrich`
Enrich a previously normalized event with repository and provider metadata.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...]
```

- `--in FILE`: normalized event input (from `normalize`) or raw provider payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: YAML/JSON rules file (optional)
- `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
  - `include_patch`: include diff patches in files [default: `true`]
  - `commit_limit`: max commits to include [default: `50`]
  - `file_limit`: max files to include [default: `200`]
- `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: attach labels

Examples:
```bash
export GITHUB_TOKEN=...  # required for GitHub API lookups

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  | jq '.enriched.github.pr.mergeable_state'
```

## Global / Built-in Flags
- `--help`: show command help
- `--version`: print version

## Exit Codes
- `0`: success (commands exit with non-zero when errors occur)

## Notes
- Redaction: CLI redacts known secret patterns and sensitive keys in output by default (see `src/utils/redact.ts`).
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`.
