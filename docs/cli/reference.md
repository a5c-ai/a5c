---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE), extracts mentions, and can enrich with repository context. Implemented with `commander` (see `src/cli.ts`).

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
events normalize [--in FILE] [--out FILE] [--source NAME] [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
```

- `--in FILE`: path to a JSON webhook payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--source NAME`: provenance (`actions|webhook|cli`) [default: `cli`]
- `--label KEY=VAL...`: attach labels (repeatable)
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits with code `2` and no output

Examples:
```bash
events normalize --in samples/workflow_run.completed.json | jq '.type, .repo.full_name'
```

### `events enrich`
Enrich a previously normalized event with repository and provider metadata.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
```

- `--in FILE`: normalized event input (from `normalize`) or raw provider payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: YAML/JSON rules file (optional)
- `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
  - `include_patch=true|false` (default: `true`) – include diff patches; when `false`, patches are removed
  - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
  - `file_limit=<n>` (default: `200`) – limit files per compare list
- `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: attach labels
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if not matched, exits with code `2` and no output

Examples:
```bash
export A5C_AGENT_GITHUB_TOKEN=...  # preferred if available; otherwise set GITHUB_TOKEN

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  | jq '.enriched.github.pr.mergeable_state'
```

## Global / Built-in Flags
- `--help`: show command help
- `--version`: print version

## Exit Codes
- `0`: success
- `1`: generic error (unexpected failure writing output, etc.)
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail)

## Notes
- Token precedence: runtime uses `A5C_AGENT_GITHUB_TOKEN` first, then `GITHUB_TOKEN` (see `src/config.ts`).
- Redaction: CLI redacts known secret patterns and sensitive keys in output by default (see `src/utils/redact.ts`).
  - Sensitive keys include: `token`, `secret`, `password`, `passwd`, `pwd`, `api_key`, `apikey`, `key`, `client_secret`, `access_token`, `refresh_token`, `private_key`, `ssh_key`, `authorization`, `auth`, `session`, `cookie`, `webhook_secret`.
  - Pattern masking includes (non-exhaustive): GitHub PATs (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghe_`), JWTs, `Bearer ...` headers, AWS `AKIA...`/`ASIA...` keys, Stripe `sk_live_`/`sk_test_`, Slack `xox...` tokens, and URL basic auth (`https://user:pass@host`).
- Tests: See `test/config.loadConfig.test.ts`, `test/redact.test.ts`, and `test/enrich.redaction.test.ts` for coverage and regression fixtures.
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`.
