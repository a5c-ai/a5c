---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`normalize`, `enrich`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE) and optionally enriches with repository context.

## Commands

### `events normalize`
Normalize a raw event payload into the NE schema.

Usage:
```bash
events normalize [--in FILE | --source actions] [--out FILE] \
  [--select FIELDS] [--filter EXPR] [--label KEY=VAL...]
```

- `--in FILE`: path to a JSON webhook payload
- `--source actions`: read `GITHUB_EVENT_PATH` in GitHub Actions
- `--out FILE`: write result JSON (stdout if omitted)
- `--select FIELDS`: comma-separated list of fields to keep
- `--filter EXPR`: JMESPath-like filter expression (planned)
- `--label KEY=VAL`: attach labels to `provenance.labels` (repeatable)

Examples:
```bash
events normalize --in samples/workflow_run.completed.json --select type,repo.full_name
```

### `events enrich`
Enrich a previously normalized event with repository and provider metadata.

Usage:
```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
  [--select FIELDS] [--filter EXPR] [--label KEY=VAL]
```

- `--in FILE`: normalized event input (from `normalize`)
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: YAML rules for emitting composed events (optional)
- `--select`, `--filter`, `--label`: same as in `normalize`

Examples:
```bash
export GITHUB_TOKEN=...  # required for GitHub API lookups

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --select type,repo.full_name,enriched.github.pr.mergeable_state
```

## Global Flags
- `--verbose`: increase log verbosity (redaction applied)
- `--version`: print version
- `--help`: show command help

## Exit Codes
- `0`: success
- `1`: generic error
- `2`: input/validation error
- `3`: provider/network error

## Notes
- Secrets: CLI redacts known secret patterns in logs and output by default.
  - Redacted patterns include GitHub PATs (`ghp_...`), JWTs, `Bearer <token>`, Stripe `sk_*`, Slack `xox*`, AWS keys, and URL basic auth.
  - Sensitive keys in objects (case-insensitive match on: `token`, `secret`, `password`, `api_key`, `client_secret`, `access_token`, etc.) are masked entirely.
  - The default mask is `REDACTED`.
  - Env tokens: `A5C_AGENT_GITHUB_TOKEN` takes precedence over `GITHUB_TOKEN` when both are set.
- Large payloads: processing is streamed where possible; see performance targets in specs.

See also: `docs/specs/README.md` and `docs/producer/phases/technical-specs/README.md`.
