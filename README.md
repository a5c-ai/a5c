[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai)

# @a5c-ai/events – Events SDK & CLI

Normalize and enrich GitHub (and other) events for agentic workflows. Use the CLI in CI or locally to turn raw webhook/Actions payloads into a compact, consistent schema that downstream agents and automations can trust.

- Quick install via npm
- Commands: `events normalize`, `events enrich`
- Output: JSON to stdout or file
- Extensible via provider adapters and enrichers

## Quick Start

Prerequisites:
- Node.js 18+ (Node 20 LTS recommended)

Install:
```bash
npm install @a5c-ai/events
# or for CLI-only usage
npm install -g @a5c-ai/events
```

Try it:
```bash
# 1) Normalize a sample payload into a Normalized Event (NE)
events normalize --in samples/push.json --out ne.json

# 2) Enrich it and disable large patches in output
events enrich --in ne.json --out out.json --flag include_patch=false

# Or run via npx instead of a local/global install
# npx @a5c-ai/events normalize --in samples/workflow_run.completed.json --out out.json

# Inspect selected fields
jq '.type, .repo.full_name, .enriched.derived.flags.include_patch' out.json
```

Token precedence for GitHub API calls (when enrichment reaches out to GitHub):
- `A5C_AGENT_GITHUB_TOKEN` takes precedence over `GITHUB_TOKEN`.
  Set `A5C_AGENT_GITHUB_TOKEN` in CI to override.

## CLI Reference

`events mentions`
- Purpose: Extract @mentions from text (stdin) or a file.
- Common flags:
  - `--source <kind>`: mention source kind (e.g., `pr_body`, `commit_message`) [default: `pr_body`]
  - `--file <path>`: read from file instead of stdin
  - `--window <n>`: context window size [default: `30`]
  - `--known-agent <name...>`: known agent names to boost confidence

`events normalize`
- Purpose: Convert a raw provider payload into the normalized Event schema.
- Common flags:
  - `--in <file>`: input JSON file (raw event)
  - `--out <file>`: write result to file (default: stdout)
  - `--source <name>`: provenance (`actions|webhook|cli`) [default: `cli`]
  - `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output
  - `--label <key=value...>`: attach labels (repeatable)

`events enrich`
- Purpose: Add metadata and correlations to a normalized event.
- Common flags:
  - `--in <file>`: normalized event JSON (or raw payload; NE shell will be created)
  - `--out <file>`: write enriched result
  - `--rules <file>`: rules file path (yaml/json)
  - `--flag include_patch=<true|false>`: include diff patches in files (default: false)
  - `--flag commit_limit=<n>`: max commits to include (default: 50)
  - `--flag file_limit=<n>`: max files to include (default: 200)
  - `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`)
  - `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output
  - `--label <key=value...>`: attach labels
  - `--flag include_patch=true|false`: include diff patches in file entries (default: false)

Behavior:
- Offline by default: without `--use-github`, no network calls occur. Output includes `enriched.github` with `partial=true` and `reason="github_enrich_disabled"`.
- When `--use-github` is set but no token is configured, output is partial with `reason="github_token_missing"` and an error entry. Mentions extraction still runs.

Exit codes: `0` success, non‑zero on errors (invalid input, etc.).

## Normalized Event Schema (MVP)

Core fields returned by `normalize`:
- `id`: provider-unique id (stubbed in CLI for local files)
- `provider`: `github` (default) or other
- `type`: coarse event type (e.g., `workflow_run`, `pull_request`, `push`)
- `occurred_at`: ISO timestamp
- `repo`: minimal repository info
- `ref`: branch/ref context
- `actor`: event actor
- `payload`: raw provider payload (verbatim)
- `enriched`: `{ metadata, derived, correlations }`
- `labels`: string array for routing
- `provenance`: `{ source: action|webhook|cli, workflow? }`

See the detailed specs for full schema and roadmap.

## Examples

GitHub Actions (normalize current run):
```yaml
- name: Normalize workflow_run
  run: |
    npx @a5c-ai/events normalize \
      --source actions \
      --in "$GITHUB_EVENT_PATH" \
      --out event.json
    jq '.type, .repo.full_name, .provenance' event.json
```

Local payload file:
```bash
events normalize --in samples/pull_request.synchronize.json \
  --out out.json
jq '.type, .labels' out.json
```

Enrichment (with GitHub lookups enabled):
```bash
export GITHUB_TOKEN=ghp_your_token_here
events enrich --in samples/pull_request.synchronize.json \
  --flag include_patch=false --flag commit_limit=50 --flag file_limit=200 \
  --use-github --out enriched.json
jq '.enriched' enriched.json
```

Selecting and filtering:
```bash
# Keep only two fields from normalized output
events normalize --in samples/push.json --select type,repo.full_name

# Filter gate: exit 2 and no output if condition fails
events enrich --in samples/pull_request.synchronize.json \
  --filter enriched.github.pr.mergeable_state=dirty

# Presence filter example (works without network enrichment too)
events enrich --in samples/pull_request.synchronize.json \
  --filter payload.pull_request.mergeable_state
```

Redaction:
- CLI output is redacted to mask common secret patterns and sensitive keys (see `src/utils/redact.ts`).

### Validate against schema

Use the NE JSON Schema at `docs/specs/ne.schema.json` to validate CLI output (example uses ajv-cli):

```bash
# Normalize a sample workflow_run payload
events normalize --in samples/workflow_run.completed.json --out out.json

# Validate result against the schema
npx ajv validate -s docs/specs/ne.schema.json -d out.json --spec=draft2020
```

### Extract mentions

Extract `@agent`/`@user` mentions from text or a file. From a file:

```bash
events mentions --source pr_body --file docs/specs/README.md | jq '.[].normalized_target'
```

Or via stdin:

```bash
echo "Please route to @developer-agent and @validator-agent" | \
  events mentions --source issue_comment | jq -r '.[].normalized_target'
# => developer-agent
# => validator-agent
```

## Configuration

Environment variables:
- `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`: enables GitHub API enrichment
- `DEBUG`: set to `true` to enable debug mode
=======
- `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`: required when using `--use-github`
- Debug flags TBD (`DEBUG=@a5c/events*`)

CLI behavior:
- Defaults are safe for local runs (no network calls in MVP commands).
- Patch diffs can be large and may contain secrets; by default patches are omitted (`include_patch=false`). Opt in with `--flag include_patch=true` when needed.
- For CI, prefer explicit `--in` and write `--out` artifacts for downstream steps.

## Samples

See `docs/specs/README.md` for examples and behavior-driven test outlines. Add your own payloads under `samples/` and reference them with `--in`.

## Development

- Build: `npm run build`
- Dev CLI: `npm run dev` (runs `src/cli.ts` via tsx)
- Lint/format: `npm run lint` / `npm run format`
- Minimal Node types + commander; TypeScript configured in `tsconfig.json`

Project structure:
- `src/cli.ts` – CLI entrypoint (commander) registering `mentions`, `normalize`, `enrich`
- `src/normalize.ts` / `src/enrich.ts` – command handlers
- `src/providers/*` – provider adapters (GitHub mapping under `providers/github`)
- `src/utils/redact.ts` – redaction utilities

Why the scope? The npm package is published under the `@a5c-ai` org scope for clarity and consistency across the a5c ecosystem. Use `npx @a5c-ai/events` to run the CLI without a global install.

## Background: a5c Platform Template

This repository initially used a generic a5c platform README. That content now lives in `docs/producer/platform-template.md`. The top‑level README focuses on the Events SDK/CLI. For the broader platform, visit https://a5c.ai and the docs.

## Links

- Specs: `docs/specs/README.md`
- CLI reference: `docs/cli/reference.md`
- More examples: `docs/specs/README.md#12-examples`
- Issues: https://github.com/a5c-ai/events/issues
- Agent registry: https://github.com/a5c-ai/registry
