---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`).
---

# CLI Reference

<<<<<<< HEAD
The CLI transforms provider payloads into a Normalized Event (NE), extracts mentions, and can enrich with repository context. Implemented with `commander` (see `src/cli.ts`).
=======
The CLI transforms provider payloads into a Normalized Event (NE) and can enrich with repository context. Implemented with `commander` (see `src/cli.ts`).
>>>>>>> d6864b0 (docs(cli): sync CLI reference and quick-start with implementation)

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
<<<<<<< HEAD
<<<<<<< HEAD
events normalize [--in FILE] [--out FILE] [--source NAME] [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
=======
events normalize [--in FILE] [--out FILE] [--source <actions|webhook|cli>] [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
>>>>>>> d6864b0 (docs(cli): sync CLI reference and quick-start with implementation)
=======
events normalize [--in FILE] [--out FILE] [--source <actions|webhook|cli>] \
  [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
>>>>>>> c849247 (docs: sync CLI docs and examples for issue #196 (select/filter, include_patch default=false, token precedence, cross-links)\n\nBy: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent))
```

- `--in FILE`: path to a JSON webhook payload
- `--out FILE`: write result JSON (stdout if omitted)
<<<<<<< HEAD
- `--source NAME`: provenance (`actions|webhook|cli`) [default: `cli`]
- `--label KEY=VAL...`: attach labels to top-level `labels[]` (repeatable)
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits with code `2` and no output
=======
- `--source <name>`: provenance source (`actions|webhook|cli`) [default: `cli`]
- `--label KEY=VAL...`: attach labels to top‑level `labels[]` (repeatable)
- `--select PATHS`: comma‑separated dot paths to include in output (e.g., `type,repo.full_name`)
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`
>>>>>>> d6864b0 (docs(cli): sync CLI reference and quick-start with implementation)

Examples:
```bash
# Select a few fields
events normalize --in samples/workflow_run.completed.json \
  --select 'type,repo.full_name,provenance.workflow.name'

# Gate output via filter (exit 2 if not matched)
events normalize --in samples/workflow_run.completed.json --filter 'type=workflow_run'
```

Notes:
- `--select` and `--filter` are implemented and applied after normalization.

### `events enrich`
Enrich a normalized event (or raw GitHub payload) with repository and provider metadata.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
<<<<<<< HEAD
<<<<<<< HEAD
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
=======
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
>>>>>>> d6864b0 (docs(cli): sync CLI reference and quick-start with implementation)
=======
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
>>>>>>> c849247 (docs: sync CLI docs and examples for issue #196 (select/filter, include_patch default=false, token precedence, cross-links)\n\nBy: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent))
```

- `--in FILE`: input JSON (normalized event or raw GitHub payload)
- `--out FILE`: write result JSON (stdout if omitted)
<<<<<<< HEAD
- `--rules FILE`: YAML/JSON rules file (optional)
- `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
  - `include_patch=true|false` (default: `true`) – include diff patches; when `false`, patches are removed
  - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
  - `file_limit=<n>` (default: `200`) – limit files per compare list
- `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: attach labels to top-level `labels[]`
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits with code `2` and no output
=======
- `--rules FILE`: path to rules file (YAML/JSON); recorded in `enriched.metadata.rules`
- `--flag KEY=VAL...`: enrichment flags map; recorded in `enriched.derived.flags`. Recognized flags include:
  - `include_patch=true|false` (default: `true`) – include diff patches; when `false`, patches are removed
  - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
  - `file_limit=<n>` (default: `200`) – limit files per compare list
- `--use-github`: enable GitHub API enrichment; equivalent to `--flag use_github=true` (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: labels to attach
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`
>>>>>>> d6864b0 (docs(cli): sync CLI reference and quick-start with implementation)

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
- `1`: generic error (unexpected failure writing output, etc.)
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch, missing `GITHUB_EVENT_PATH` when `--source actions`)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail)

## Security and Redaction
- Secrets: known patterns are redacted in output and logs by default; see `src/utils/redact.ts`.
<<<<<<< HEAD
- Tokens: set `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN` for GitHub enrichment; tokens are never printed. If both are set, `A5C_AGENT_GITHUB_TOKEN` takes precedence.
=======
- Tokens: set `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN` for GitHub enrichment (precedence: `A5C_AGENT_GITHUB_TOKEN` then `GITHUB_TOKEN`); tokens are never printed.
>>>>>>> d0680f9 (docs: sync CLI docs and examples for issue #196 (select/filter, include_patch default=false, token precedence, cross-links)\n\nBy: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent))

## Cross-References
- Specs: `docs/specs/README.md`
- Samples: `samples/`
<<<<<<< HEAD
- Tests: `tests/mentions.*`, `tests/enrich.basic.test.ts`, plus additional tests under `test/`
=======
- Tests: `tests/mentions.*`, `tests/enrich.basic.test.ts`, `tests/cli.select-filter.*.ts`, `tests/cli.enrich.flags.test.ts`
>>>>>>> d0680f9 (docs: sync CLI docs and examples for issue #196 (select/filter, include_patch default=false, token precedence, cross-links)\n\nBy: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent))
