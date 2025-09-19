[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai) [![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://app.codecov.io/gh/a5c-ai/events/tree/a5c/main)

# @a5c-ai/events — Events SDK & CLI

Turn raw GitHub Actions/webhook payloads into a consistent Normalized Event (NE) that agents and automations can trust. Enrich with repo context, extract @mentions, generate prompt context, apply rules, and emit composed events. Use it as a CLI in CI or as a programmatic SDK.

- Commands: `events normalize`, `events enrich`, `events mentions`, `events generate_context`, `events reactor`, `events emit`, `events validate` (see docs for full flags)
- Output: JSON to stdout or file
- Provider: GitHub first; adapter surface enables more providers
- Safe by default: offline enrichment unless explicitly enabled

See: `docs/cli/reference.md`, `docs/specs/ne.schema.json`, `docs/user/sdk-quickstart.md`.

## What It Is

Purpose: a minimal, predictable events layer for agentic workflows.

Scope:

- Normalize provider payloads to the NE schema
- Enrich with repository metadata (offline by default; optional GitHub API)
- Extract `@mentions` from PRs, issues, commits, and code diffs
- Generate task/prompt context from templates (`generate_context`)
- Apply rule-based reactors to produce composed events
- Validate against the NE JSON Schema

Supported GitHub types: `workflow_run`, `pull_request`, `push`, `issue`, `issue_comment`, `check_run`, `release`, `deployment`/`deployment_status`, `job` (`workflow_job`), `step` (when granular), `alert` (e.g., code/secret scanning).

Ownership semantics (routing): enrichment computes `owners_union` — the sorted, de‑duplicated union of CODEOWNERS matches across changed files. Unlike GitHub’s last‑rule‑wins, union semantics support broader, safer routing. Details: `docs/routing/ownership-and-routing.md`.

Branch model: `a5c/main` is development/staging; `main` is production.

## Install

Prerequisites: Node.js 20.x (see `.nvmrc`).

```bash
npm install @a5c-ai/events
# CLI-only
npm install -g @a5c-ai/events
```

## Quick Start (CLI)

```bash
# Normalize a payload file
npx @a5c-ai/events normalize \
  --in samples/workflow_run.completed.json \
  --out out.json

# Peek a few fields
jq '.type, .repo.full_name, .provenance.workflow?.name' out.json

# Validate against the NE schema (quiet on success)
events validate --in out.json --schema docs/specs/ne.schema.json --quiet
```

Enrich offline vs online:

```bash
# Offline (default; no network calls)
events enrich --in samples/pull_request.synchronize.json --out enriched.offline.json

# Online (requires token)
export GITHUB_TOKEN=ghp_xxx
events enrich --in samples/pull_request.synchronize.json --use-github --out enriched.online.json
```

Mentions scanning (examples):

```bash
# Disable code-comment scanning over changed files
events enrich --in ... --flag 'mentions.scan.changed_files=false'

# Restrict languages
events enrich --in ... --flag 'mentions.languages=ts,js'
```

Canonical flags and defaults live in `docs/cli/reference.md#events-enrich` and `#mentions-scanning`.

## Quick Start (SDK)

See `docs/user/sdk-quickstart.md` for a minimal example using `mapToNE`, `enrichGithub`, and helpers.

## GitHub Actions Example

End‑to‑end recipe (normalize → enrich → reactor → emit): `docs/ci/actions-e2e-example.md`.

```yaml
- name: Normalize current run
  run: |
    npx @a5c-ai/events normalize \
      --source actions \
      --in "$GITHUB_EVENT_PATH" \
      --out event.json

- name: Enrich (offline by default)
  run: |
    events enrich --in event.json --out event.enriched.json
```

## CLI Overview

- `events normalize` — Map provider payload to NE. Filters/selectors available.
- `events enrich` — Add metadata, mentions, ownership, correlations; optional `--use-github`.
- `events mentions` — Extract `@mentions` from files/stdin.
- `events generate_context` — Render templates from file/github URIs with the event as data.
- `events reactor` — Apply rules to NE and emit composed events.
- `events emit` — Emit composed events to sinks (stdout by default).
- `events validate` — Validate NE (and enriched documents) against JSON Schema.

Full command/flag reference: `docs/cli/reference.md`.

## Tokens, Networking, Exit Codes

- Offline by default: enrichment makes no network calls unless `--use-github` is provided.
- Tokens: `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN` (the former takes precedence). Some commands like `generate_context` may use tokens to fetch `github://` templates.
- Exit codes: `0` success; `1` generic error; `2` input/validation error (missing `--in`, invalid JSON, filter mismatch); `3` provider/network error (e.g., `--use-github` without a token).

## NE Schema

Core fields produced by `normalize` include `id`, `provider`, `type`, `occurred_at`, `repo`, `ref`, `actor`, `payload`, `labels`, `provenance`. Enrichment adds `enriched` and optional `composed[]` (from rules).

- JSON Schema (canonical): `docs/specs/ne.schema.json`
- Overview: `docs/cli/ne-schema.md`

Ref note: `ref.type` is `branch | tag | unknown`. PRs use branch semantics; `ref.base`/`ref.head` carry branch names. There is no `pr` enum value.

## CI Checks

Guidance and required checks: `docs/ci/ci-checks.md`.

- PRs: quick checks (`Lint`, `Typecheck`, `Tests`, commit hygiene)
- Protected branches (`a5c/main`, `main`): build + full tests with coverage

Validate locally: `npm run -s validate:examples`.

## Configuration

Environment variables:

- `A5C_AGENT_GITHUB_TOKEN` / `GITHUB_TOKEN` — enable online GitHub enrichment
- `DEBUG=true` — enable verbose logs in select paths
- Logging toggles and observability: `docs/observability.md`

CLI defaults favor reproducibility in CI: explicit `--in`, write artifacts with `--out`.

## Development

- Build: `npm run build`
- Dev CLI: `npm run dev`
- Lint/Typecheck/Format: `npm run lint` / `npm run typecheck` / `npm run format`
- Commit conventions: Conventional Commits; local hooks via Husky + commitlint (see `CONTRIBUTING.md` and `docs/dev/precommit-hooks.md`)
- Node policy: Node 20 LTS (see `.nvmrc`, `package.json#engines`)

Project structure:

- `src/cli.ts` — CLI entry (mentions, normalize, enrich, generate_context, reactor, emit, validate)
- `src/providers/github/*` — GitHub mapping/enrichment
- `docs/*` — CLI reference, specs, CI examples, routing semantics

## Links

- How‑to guide: `docs/user/how-to.md`
- CLI reference: `docs/cli/reference.md`
- SDK quickstart: `docs/user/sdk-quickstart.md`
- NE schema: `docs/specs/ne.schema.json`
- Actions e2e example: `docs/ci/actions-e2e-example.md`
- Ownership semantics: `docs/routing/ownership-and-routing.md`
