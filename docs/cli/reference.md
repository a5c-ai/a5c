---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`, `emit`, `validate`).
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

- No network calls are performed by default. In offline mode, `enriched.github = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }`.
- Pass `--use-github` to enable GitHub API enrichment. If no token is configured, enrichment is skipped/partial with `reason: 'token:missing'` and the CLI exits with code `3` when an API call is required.

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
  - Mentions scanning flags (code comments in changed files):
    - `mentions.scan.changed_files=true|false` (default: `true`) – enable/disable scanning code comments in changed files for `@mentions`
    - `mentions.max_file_bytes=<bytes>` (default: `204800`) – skip files larger than this many bytes when scanning
    - `mentions.languages=<ext,...>` – optional allowlist of file extensions to scan (e.g., `ts,tsx,js,jsx,py,go,yaml`). When omitted, language/extension detection is used.
- `--use-github`: enable GitHub API enrichment; equivalent to `--flag use_github=true` (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`). Without this flag, the CLI performs no network calls and sets `enriched.github = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }`.
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

# Mentions scanning controls (code comments in changed files)
# Disable scanning entirely
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false | jq '.enriched.mentions // [] | length'

# Restrict by file types and cap bytes
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.languages=ts,tsx,js \
  --flag mentions.max_file_bytes=102400 \
  | jq '.enriched.mentions // [] | map(select(.source=="code_comment")) | length'

# With rules (composed events)
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
```

Note:

- `.composed` may be absent or `null` when no rules match. Guard with `(.composed // [])` as above.
- The `reason` field may be omitted depending on rule configuration. See specs §6.1 for composed events structure: `docs/specs/README.md#61-rule-engine-and-composed-events`.
- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).

````

Outputs:

- When enriching a PR with `--use-github`, the CLI exposes per-file owners under `enriched.github.pr.owners` and the deduplicated, sorted union of all CODEOWNERS across changed files under `enriched.github.pr.owners_union`.

Without network calls (mentions only):

```bash
events enrich --in samples/push.json --out out.json
jq '.enriched.mentions' out.json
````

### `events emit`

Emit a JSON event to a sink (stdout or file). The payload is redacted before being written.

Usage:

```bash
events emit [--in FILE] [--sink <stdout|file>] [--out FILE]
```

- `--in FILE`: input JSON file (reads from stdin if omitted)
- `--sink <name>`: sink name; `stdout` (default) or `file`
- `--out FILE`: output file path (required when `--sink file`)

Behavior:

- Redaction: payload is masked using the same rules as other commands (see `src/utils/redact.ts`). Sensitive keys and common secret patterns are redacted before emission.
- Defaults: when `--sink` is omitted, `stdout` is used. When `--sink file` is set, `--out` is required; otherwise the command exits with code `1` and writes an error to stderr.

Examples:

```bash
# From file to stdout (default)
events emit --in samples/push.json

# From stdin to stdout
cat samples/push.json | events emit

# To a file sink
events emit --in samples/push.json --sink file --out out.json
```

Exit codes:

- `0`: success
- `1`: error (I/O, JSON parse, or missing `--out` for file sink)

### `events emit`

Emit a JSON event to a sink (stdout or file). The payload is redacted before being written.

Usage:

```bash
events emit [--in FILE] [--sink <stdout|file>] [--out FILE]
```

- `--in FILE`: input JSON file (reads from stdin if omitted)
- `--sink <name>`: sink name; `stdout` (default) or `file`
- `--out FILE`: output file path (required when `--sink file`)

Behavior:

- Redaction: payload is masked using the same rules as other commands (see `src/utils/redact.ts`). Sensitive keys and common secret patterns are redacted before emission.
- Defaults: when `--sink` is omitted, `stdout` is used. When `--sink file` is set, `--out` is required; otherwise the command exits with code `1` and writes an error to stderr.

Examples:

```bash
# From file to stdout (default)
events emit --in samples/push.json

# From stdin to stdout
cat samples/push.json | events emit

# To a file sink
events emit --in samples/push.json --sink file --out out.json
```

Exit codes:

- `0`: success
- `1`: error (I/O, JSON parse, or missing `--out` for file sink)

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
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch, missing `GITHUB_EVENT_PATH` when `--source actions`)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail)

## Notes

- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).
  - Sensitive keys include: `token`, `secret`, `password`, `passwd`, `pwd`, `api_key`, `apikey`, `key`, `client_secret`, `access_token`, `refresh_token`, `private_key`, `ssh_key`, `authorization`, `auth`, `session`, `cookie`, `webhook_secret`.
  - Pattern masking includes (non-exhaustive): GitHub PATs (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghe_`), JWTs, `Bearer ...` headers, AWS `AKIA...`/`ASIA...` keys, Stripe `sk_live_`/`sk_test_`, Slack `xox...` tokens, and URL basic auth (`https://user:pass@host`).

- Tests: See `test/config.loadConfig.test.ts`, `test/redact.test.ts`, `test/enrich.redaction.test.ts`, `test/config.precedence.test.ts`, and additional cases under `tests/` for coverage and regression fixtures.
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`. Technical specs reference for token precedence: `docs/producer/phases/technical-specs/tech-stack.md`.
