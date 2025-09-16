[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai) [![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://codecov.io/gh/a5c-ai/events)

# @a5c-ai/events – Events SDK & CLI

Normalize and enrich GitHub (and other) events for agentic workflows. Use the CLI in CI or locally to turn raw webhook/Actions payloads into a compact, consistent schema that downstream agents and automations can trust.

- Quick install via npm
- Commands: `events mentions`, `events normalize`, `events enrich`, `events emit`, `events validate`
- Output: JSON to stdout or file
- Extensible via provider adapters and enrichers

## Ownership & Routing

See docs/routing/ownership-and-routing.md for how CODEOWNERS drives routing and how owners_union is used in enrichment.

## Quick Start

Prerequisites:

- Node.js 20.x LTS. The repo includes an `.nvmrc` pinning Node 20 for local parity with CI.
  - If you use `nvm`, run `nvm use` in the project root.

Install:

```bash
npm install @a5c-ai/events
# or for CLI-only usage
npm install -g @a5c-ai/events
```

Try it:

```bash
# Normalize a payload file
npx @a5c-ai/events normalize --in samples/workflow_run.completed.json --out out.json

# Inspect selected fields
jq '.type, .repo.full_name, .provenance.workflow?.name' out.json

# Validate against the NE schema (quiet on success)
cat out.json | npx @a5c-ai/events validate --quiet
```

## CLI Reference

### Mentions config (Quick Start)

Control where and how mentions are scanned during `enrich`:

```bash
# Disable scanning changed files for code-comment mentions
events enrich --in ... --flag 'mentions.scan.changed_files=false'

# Limit per-file bytes when scanning code comments (default: 200KB / 204800 bytes)
events enrich --in ... --flag 'mentions.max_file_bytes=65536'

# Restrict code-comment scanning to specific languages
events enrich --in ... --flag "mentions.languages=ts,js,md"
```

See: docs/specs/README.md#4.2-mentions-schema for full details.

`events mentions`

- Purpose: Extract @mentions from text (stdin) or a file.
- Common flags:
  - `--source <kind>`: `pr_body|pr_title|commit_message|issue_comment` (default: `pr_body`)
  - `--file <path>`: read from file instead of stdin
  - `--window <n>`: context window size (default: 30)
  - `--known-agent <name...>`: known agent names to boost confidence

`events normalize`

- Purpose: Convert a raw provider payload into the normalized Event schema.
- Common flags:
  - `--in <file>`: input JSON file (raw event)
  - `--out <file>`: write result to file (default: stdout)
  - `--source <name>`: provenance (`actions|webhook|cli`) [default: `cli`]
  - `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output
  - `--label <key=value...>`: attach labels to top‑level `labels[]` (repeatable)

`events enrich`

- Purpose: Add metadata and correlations to a normalized event.
- Common flags:
  - `--in <file>`: normalized event JSON (or raw payload; NE shell will be created)
  - `--out <file>`: write enriched result
  - `--rules <file>`: rules file path (yaml/json)
- `--flag include_patch=<true|false>`: include diff patches in files (default: false)
- `--flag commit_limit=<n>`: max commits to include (default: 50)
- `--flag file_limit=<n>`: max files to include (default: 200)
  - Mentions scanning (code comments in changed files):
    - `--flag mentions.scan.changed_files=<true|false>` (default: true)
    - `--flag mentions.max_file_bytes=<bytes>` (default: 200KB / 204800 bytes)
    - `--flag mentions.languages=<ext,...>` (optional list such as `ts,tsx,js,jsx,py,go,yaml`)
  - `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN`)
  - `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output
  - `--label <key=value...>`: attach labels to top‑level `labels[]`

Behavior:

- Offline by default: without `--use-github`, no network calls occur. Output includes `enriched.github` with `partial=true` and `reason="github_enrich_disabled"`.
- When `--use-github` is set but no token is configured, the CLI exits with code `3` (provider/network error) and prints an error. Use programmatic APIs with an injected Octokit for partial/offline testing if needed.

Exit codes: `0` success, non‑zero on errors (invalid input, etc.).

### Mentions scanning examples

Disable scanning changed files for code-comment mentions:

```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false
```

Limit scanned file size and restrict to TS/JS:

```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.max_file_bytes=102400 \
  --flag mentions.languages=ts,tsx,js,jsx
```

## Normalized Event Schema (MVP)

Core fields returned by `normalize`:

- `id`: provider-unique id (stubbed in CLI for local files)
- `provider`: `github` (default) or other
- `type`: coarse event type (e.g., `workflow_run`, `pull_request`, `push`)
- `occurred_at`: ISO timestamp
- `repo`: minimal repository info
- `ref`: branch/ref context
- `actor`: event actor
- `payload`: raw provider payload (object | array; verbatim). Note: payloads may be large; avoid printing the entire value in examples and prefer selecting specific fields with tools like `jq`.
- `enriched`: `{ metadata, derived, correlations }`
- `labels`: string array for routing (e.g., `env=staging`)
- `provenance`: `{ source: action|webhook|cli, workflow? }` (no labels here)

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
jq '.type, .repo.full_name, .labels' event.json
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

With rules (composed events):

```bash
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
  # note: `reason` may be omitted depending on rule configuration
```

## Coverage (Optional)

CI can upload coverage to Codecov and show a badge in this README. Uploads are disabled by default and only run when a token is configured.

- Add a repo Secret or Variable named `CODECOV_TOKEN`.
- When present, the following workflows upload `coverage/lcov.info` using `codecov/codecov-action@v4`:
  - `.github/workflows/tests.yml` (push on `a5c/main` and `main`)
  - `.github/workflows/quick-checks.yml` (PRs)
  - `.github/workflows/pr-tests.yml` (PRs)
- If the token is absent, the Codecov step is skipped and CI remains green.

Badge note: If your Codecov project is public, the badge works without a token parameter. For private projects, configure the Codecov badge as appropriate for your org and visibility.

### Auth tokens: precedence & redaction

- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).
  - Sensitive keys include: `token`, `secret`, `password`, `passwd`, `pwd`, `api_key`, `apikey`, `key`, `client_secret`, `access_token`, `refresh_token`, `private_key`, `ssh_key`, `authorization`, `auth`, `session`, `cookie`, `webhook_secret`.
  - Pattern masking includes (non‑exhaustive): GitHub PATs (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghe_`), JWTs, `Bearer ...` headers, AWS `AKIA...`/`ASIA...` keys, Stripe `sk_live_`/`sk_test_`, Slack `xox...` tokens, and URL basic auth (`https://user:pass@host`).

Examples:

```bash
# Precedence: A5C_AGENT_GITHUB_TOKEN wins when both are set
export GITHUB_TOKEN=ghp_low_scope
export A5C_AGENT_GITHUB_TOKEN=ghs_org_or_repo_scope
events enrich --in samples/pull_request.synchronize.json --use-github | jq '.enriched.github.provider'

# Missing token with --use-github: exits 3 and marks reason
unset GITHUB_TOKEN A5C_AGENT_GITHUB_TOKEN
events enrich --in samples/pull_request.synchronize.json --use-github || echo $?
# stderr: GitHub enrichment failed: ...
# exit code: 3

# Mentions scanning controls for code comments
# Disable scanning of changed files
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false | jq '.enriched.mentions // [] | length'

# Restrict to selected languages and reduce size cap
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.languages=ts,js \
  --flag mentions.max_file_bytes=102400 \
  | jq '.enriched.mentions // [] | map(select(.source=="code_comment")) | length'
```

See also: CLI reference for flags and exit codes: `docs/cli/reference.md`. For a complete and authoritative list of Mentions flags under `events enrich`, see `docs/cli/reference.md#events-enrich`.

### Validate against schema

Use the NE JSON Schema at `docs/specs/ne.schema.json` to validate CLI output.

Note: outputs that include `composed` are enriched; `composed` is optional and defined in the NE schema (`docs/specs/ne.schema.json`), so it does not need to be removed for validation. If you want to validate the normalized-only subset, validate before enrichment or strip it with `jq 'del(.composed)'`. When present, `composed[].payload` is `object | array | null`.

```bash
# Normalize a sample workflow_run payload
events normalize --in samples/workflow_run.completed.json --out out.json

# Validate result using the built-in validator
events validate --in out.json --schema docs/specs/ne.schema.json --quiet

# Alternative (ajv-cli)
# npx ajv validate -s docs/specs/ne.schema.json -d out.json --spec=draft2020
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
- `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`: required when using `--use-github`
- Debug flags TBD (`DEBUG=@a5c/events*`)

CLI behavior:

- Defaults are safe for local runs (no network calls unless `--use-github` is set).
- Exit codes: 0 success; 1 generic error; 2 input/validation error (missing `--in`, invalid JSON, filter mismatch); 3 provider/network error when `--use-github` is requested and calls fail.
- For CI, prefer explicit `--in` and write `--out` artifacts for downstream steps.

## Samples

See `docs/specs/README.md` for examples and behavior-driven test outlines. Add your own payloads under `samples/` and reference them with `--in`.

## Development

- Build: `npm run build`
- Dev CLI: `npm run dev` (runs `src/cli.ts` via tsx)
- Lint/Typecheck/Format: `npm run lint` / `npm run typecheck` / `npm run format`
  - CI Observability: see `.github/actions/obs-summary` composite action which writes a job summary and uploads `observability.json`. The composite sets up Node (`actions/setup-node@v4`) with default Node 20; override with `with.node-version` if needed. Example usage lives in `.github/workflows/tests.yml`.
  - CI runs lint and typecheck on PRs; see `.github/workflows/lint.yml` and `.github/workflows/typecheck.yml`.
  - Local pre-commit enforces whitespace/newline hygiene, lint, and typecheck; see `docs/contributing/README.md#pre-commit-checks`.
- Minimal Node types + commander; TypeScript configured in `tsconfig.json`

### Node.js Version Policy

This project targets Node 20 LTS by default:

- Engines: `"node": ">=20"` in `package.json`
- Local: `.nvmrc` pins Node 20
- CI: workflows use `actions/setup-node@v4` with `node-version-file: '.nvmrc'`

Typecheck CI runs a matrix on Node 20 and 22 to catch version-specific type issues, but build/tests default to Node 20.

### Commit conventions

We follow Conventional Commits. Local commit messages are validated with Husky + commitlint, and PRs run a commitlint check. See `docs/contributing/git-commits.md`.

To use the commit message template locally:

```
git config commit.template .gitmessage.txt
```

Project structure:

- `src/cli.ts` – CLI entrypoint (mentions, normalize, enrich, emit, validate)
- `src/normalize.ts` / `src/enrich.ts` – command handlers
- `src/providers/*` – provider adapters (GitHub mapping under `providers/github`)
- `src/utils/redact.ts` – redaction utilities

## Background: a5c Platform Template

This repository initially used a generic a5c platform README. That content now lives in `docs/producer/platform-template.md`. The top‑level README focuses on the Events SDK/CLI. For the broader platform, visit https://a5c.ai and the docs.

### Composed + Validate (Walkthrough)

You can enrich with rules to emit composed events, then validate the enriched output against the NE schema. The NE schema includes an optional top‑level `composed` array; enriched outputs validate as‑is. If you want to validate only the normalized core (without composed), you may optionally strip `composed` for that purpose.

```bash
# Enrich with rules to produce `.composed[]`
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  --out enriched.json

# Inspect composed events (guard for absence)
jq '(.composed // []) | map({key, reason})' enriched.json

# Validate the enriched document against the NE schema (no need to drop `.composed`)
events validate --in enriched.json --schema docs/specs/ne.schema.json --quiet

# Optional: validate the normalized-only subset by removing `.composed`
jq 'del(.composed)' enriched.json | events validate --schema docs/specs/ne.schema.json --quiet
```

Notes:

- `.composed` may be absent when no rules match. Use `(.composed // [])` in `jq`.
- NE schema: `docs/specs/ne.schema.json` includes optional top‑level `composed`. `composed[].payload` may be `object | array | null`.

## Links

- Specs: `docs/specs/README.md`
- Issues: https://github.com/a5c-ai/events/issues
- Agent registry: https://github.com/a5c-ai/registry
