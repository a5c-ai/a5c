---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE), extracts mentions, and can enrich with repository context. Implemented with `commander` (see `src/cli.ts`).

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
- `--source <name>`: provenance source (`actions|webhook|cli`) [default: `cli`]
- `--label KEY=VAL...`: attach labels to top‑level `labels[]` (repeatable)
- `--select PATHS`: comma‑separated dot paths to include in output (e.g., `type,repo.full_name`)
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`

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

Behavior:
- No network calls are performed by default.
- Pass `--use-github` to enable GitHub API enrichment. A `GITHUB_TOKEN` (or `A5C_AGENT_GITHUB_TOKEN`) must be present; otherwise enrichment is skipped and marked as partial.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
```

- `--in FILE`: input JSON (normalized event or raw GitHub payload)
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: YAML/JSON rules file (optional). When provided, matching rules emit `composed[]` with `{ key, reason, targets?, labels?, payload? }`.
- `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
  - `include_patch=true|false` (default: `false`) – include diff patches; when `false`, patches are removed. Defaulting to false avoids leaking secrets via diffs and keeps outputs small; enable only when required.
  - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
  - `file_limit=<n>` (default: `200`) – limit files per compare list
- `--use-github`: enable GitHub API enrichment; equivalent to `--flag use_github=true` (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`). Without this flag, the CLI performs no network calls and sets `enriched.github = { provider: 'github', skipped: true, reason: 'flag:not_set' }`.
- `--label KEY=VAL...`: labels to attach
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`

Examples:
```bash
export GITHUB_TOKEN=...  # required for GitHub API lookups

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  | jq '.enriched.github.pr.mergeable_state'

# With rules (composed events)
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '[.composed[] | {key, reason}]'
- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).
```

Outputs:
- When enriching a PR with `--use-github`, the CLI exposes per-file owners under `enriched.github.pr.owners` and the deduplicated, sorted union of all CODEOWNERS across changed files under `enriched.github.pr.owners_union`.

Without network calls (mentions only):
```bash
events enrich --in samples/push.json --out out.json
jq '.enriched.mentions' out.json
```
### `events validate`
Validate a JSON document against the NE JSON Schema.

Usage:
```bash
events validate [--in FILE | < stdin ] [--schema FILE] [--quiet]
```

- `--in FILE`: JSON input file (reads from stdin if omitted)
- `--schema FILE`: schema path (defaults to `docs/specs/ne.schema.json`)
- `--quiet`: print nothing on success; still exits with code 0

Examples:
```bash
# Validate normalized output from a sample
events normalize --in samples/push.json | events validate --quiet

# Validate a file explicitly
events validate --in out.json --schema docs/specs/ne.schema.json
```

Exit codes:
- 0: valid
- 2: schema validation failed (invalid)
- 1: other error (I/O, JSON parse)

## Global Options
- `--help`: show command help
- `--version`: print version

## Exit Codes
- `0`: success
- `1`: generic error (unexpected failure writing output, etc.)
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail)

## Notes
- Secrets: CLI redacts known secret patterns in logs and output by default.
  - Redacted patterns include GitHub PATs (`ghp_...`), JWTs, `Bearer <token>`, Stripe `sk_*`, Slack `xox*`, AWS keys, and URL basic auth.
  - Sensitive keys in objects (case-insensitive match on: `token`, `secret`, `password`, `api_key`, `client_secret`, `access_token`, etc.) are masked entirely.
  - The default mask is `REDACTED`.
  - Env tokens: `A5C_AGENT_GITHUB_TOKEN` takes precedence over `GITHUB_TOKEN` when both are set.
- Large payloads: processing is streamed where possible; see performance targets in specs.

See also: `docs/specs/README.md` and `docs/producer/phases/technical-specs/README.md`.
