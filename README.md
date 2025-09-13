[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai)

# @a5c/events – Events SDK & CLI

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
npm install @a5c/events
# or for CLI-only usage
npm install -g @a5c/events
```

Try it:
```bash
# Normalize a payload file
npx @a5c/events normalize --in samples/workflow_run.completed.json --out out.json

# Inspect selected fields
jq '.type, .repo.full_name, .provenance.workflow?.name' out.json
```

## CLI Reference

`events normalize`
- Purpose: Convert a raw provider payload into the normalized Event schema.
- Common flags:
  - `--in <file>`: input JSON file (raw event)
  - `--out <file>`: write result to file (default: stdout)
  - `--provider <name>`: provider key (default: `github`)

`events enrich`
- Purpose: Add metadata and correlations to a normalized event.
- Common flags:
  - `--in <file>`: normalized event JSON or raw provider payload
  - `--out <file>`: write enriched result
  - `--rules <file>`: rules file (reserved)
  - `--flag include_patch=<true|false>`: include diff patches in files (default: false)
  - `--flag commit_limit=<n>`: max commits to include (default: 50)
  - `--flag file_limit=<n>`: max files to include (default: 50)
  - `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN`)

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
    npx @a5c/events normalize --provider github \
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

Enrichment (GitHub PR/push):
```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag include_patch=false --flag commit_limit=50 --flag file_limit=50 \
  --out enriched.json
jq '.enriched' enriched.json
```

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
- `GITHUB_TOKEN`: optional, enables API-based enrichment in future versions
- Debug flags TBD (`DEBUG=@a5c/events*`)

CLI behavior:
- Defaults are safe for local runs (no network calls in MVP commands).
- For CI, prefer explicit `--in` and write `--out` artifacts for downstream steps.

## Samples

See `docs/specs/README.md` for examples and behavior-driven test outlines. Add your own payloads under `samples/` and reference them with `--in`.

## Development

- Build: `npm run build`
- Dev CLI: `npm run dev` (runs `src/cli.ts` via tsx)
- Lint/format: `npm run lint` / `npm run format`
- Minimal Node types + yargs; TypeScript configured in `tsconfig.json`

Project structure:
- `src/cli.ts` – entrypoint registering commands
- `src/commands/normalize.ts` – normalize implementation (MVP stub)
- `src/commands/enrich.ts` – enrichment implementation (MVP stub)
- `src/providers/*` – future provider adapters
- `src/enrichers/*` – future enrichment modules

## Background: a5c Platform Template

This repository initially used a generic a5c platform README. That content now lives in `docs/producer/platform-template.md`. The top‑level README focuses on the Events SDK/CLI. For the broader platform, visit https://a5c.ai and the docs.

## Links

- Specs: `docs/specs/README.md`
- Issues: https://github.com/a5c-ai/events/issues
- Agent registry: https://github.com/a5c-ai/registry
