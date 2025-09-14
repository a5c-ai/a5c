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
- `--label KEY=VAL...`: attach labels to top-level `labels[]` (repeatable)

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
- `--rules FILE`: YAML/JSON rules file (optional). When provided and a rule matches, output includes a top-level `composed[]` array of items `{ type: "composed", key, labels?, targets?, payload? }`.
- `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
  - `include_patch`: include diff patches in files [default: `false`]
  - `commit_limit`: max commits to include [default: `50`]
  - `file_limit`: max files to include [default: `200`]
- `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
- `--label KEY=VAL...`: attach labels to top-level `labels[]`

Examples:
```bash
export A5C_AGENT_GITHUB_TOKEN=...  # preferred if available; otherwise set GITHUB_TOKEN

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  | jq '.enriched.github.pr.mergeable_state'

# Evaluate composed event rules (offline)
events enrich --in samples/pull_request.synchronize.json \
  --rules tests/fixtures/rules/conflicts.yml \
  | jq '(.composed // [])[].key'
```

## Global / Built-in Flags
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
- Tests: See `test/config.loadConfig.test.ts`, `test/redact.test.ts`, `test/enrich.redaction.test.ts`, and additional cases under `tests/` for coverage.
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`. Technical specs reference for token precedence: `docs/producer/phases/technical-specs/tech-stack.md`.
