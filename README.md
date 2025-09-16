[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai)

# @a5c-ai/events – Events SDK & CLI

Normalize and enrich GitHub (and other) events for agentic workflows. Use the CLI in CI or locally to turn raw webhook/Actions payloads into a compact, consistent schema that downstream agents and automations can trust.

- Quick install via npm
- Commands: `events mentions`, `events normalize`, `events enrich`, `events emit`, `events validate` (see `docs/cli/reference.md#events-emit` for `emit` options and examples)
- Output: JSON to stdout or file
- Extensible via provider adapters and enrichers

## Ownership & Routing

See docs/routing/ownership-and-routing.md for how CODEOWNERS drives routing and how owners_union is used in enrichment.

Note: For routing, this project computes a per-PR `owners_union` as the sorted, de-duplicated union of all owners across changed files. This intentionally differs from GitHub CODEOWNERS evaluation where the last matching rule wins for a single file. See the routing doc for examples and rationale.

## Quick Start

Prerequisites:

- Node.js 20.x LTS (see `.nvmrc` for CI parity).
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

### Mentions flags (enrich)

These control code-comment mention scanning performed by `events enrich`:

- `--flag mentions.scan.changed_files=<true|false>` (default: `true`) — enable/disable scanning of changed files for `@mentions` inside code comments.
- `--flag mentions.max_file_bytes=<bytes>` (default: `204800`) — skip files larger than this many bytes when scanning code comments.
- `--flag mentions.languages=<code,...>` — optional allowlist of language codes to scan (e.g., `js,ts,py,go,yaml,md`). When omitted, filename/heuristics are used.
  - Note: Pass language codes, not raw extensions. Common extensions map internally: `tsx→ts`, `jsx→js`, `mjs/cjs→js`, `yml→yaml`, `markdown→md`.

Examples:

```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false

events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.max_file_bytes=102400 \
  --flag mentions.languages=ts,tsx,js,jsx
```

See also:

- docs/specs/README.md#4.2-mentions-schema
- docs/cli/reference.md#events-enrich

### Mentions config (Quick Start)

Use a simple example, then see the CLI reference for canonical flags and defaults:

```bash
# Disable scanning of changed files (code-comment mentions)
events enrich --in ... --flag 'mentions.scan.changed_files=false'
```

Full reference and examples: docs/cli/reference.md#events-enrich

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
  - `--source <name>`: provenance (`action|webhook|cli`) [default: `cli`]
    - Alias: the CLI accepts `actions` as an input alias (e.g., in GitHub Actions); the stored value is normalized to `provenance.source: "action"`.
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
- Mentions scanning flags are centralized in `docs/cli/reference.md` (see that section for canonical wording and defaults).
- `--use-github`: enable GitHub API enrichment (requires `GITHUB_TOKEN`)
- `--select <paths>`: comma-separated dot paths to include in output
- `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output
- `--label <key=value...>`: attach labels to top‑level `labels[]`

Behavior:

- Offline by default: without `--use-github`, no network calls occur. Output includes a minimal stub under `enriched.github`:

  ```json
  {
    "enriched": {
      "github": {
        "provider": "github",
        "partial": true,
        "reason": "flag:not_set"
      }
    }
  }
  ```

- Online with `--use-github` and a valid token: enrichment populates fields like `enriched.github.pr.mergeable_state`, `enriched.github.pr.files[]`, and `enriched.github.branch_protection`.
- With `--use-github` but token missing: the CLI exits with code `3` and writes an error (no JSON output). For SDK tests with an injected Octokit, a partial object with `reason: "token:missing"` may appear programmatically, but not via the CLI.

Exit codes: `0` success, non‑zero on errors (invalid input, etc.).

#### Offline GitHub enrichment

When you do not pass `--use-github`, enrichment runs fully offline and stubs the GitHub section to avoid implying data that was not fetched.

Example (excerpt):

```jsonc
{
  "enriched": {
    "github": {
      "provider": "github",
      "partial": true,
      "reason": "flag:not_set",
    },
  },
}
```

With `--use-github` and a valid token, fields are populated. For example:

```bash
events enrich --in samples/pull_request.synchronize.json --use-github | jq '.enriched.github.pr.mergeable_state'
```

If you pass `--use-github` without a token, the CLI exits with code `3` and prints a clear error to stderr. The programmatic API may return a partial object with `reason: "token:missing"`, but the CLI does not emit JSON on this error.

### Mentions scanning examples

See the CLI reference for canonical examples covering `mentions.scan.changed_files`, `mentions.max_file_bytes`, and `mentions.languages`:

- docs/cli/reference.md#events-enrich

See E2E coverage in `tests/mentions.flags.e2e.test.ts` for practical examples validating:

- default scanning on for changed files
- disabling scan via `mentions.scan.changed_files=false`
- size cap via `mentions.max_file_bytes`
- language restrictions via `mentions.languages`

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

Notes:

- Example outputs may omit or truncate large `payload` bodies to keep docs readable.
- The optional `composed[].payload` allows `object | array | null` (from enrichment/rules). See `docs/specs/ne.schema.json`.

## Examples

GitHub Actions (normalize current run):

```yaml
- name: Normalize workflow_run
  run: |
    npx @a5c-ai/events normalize \
      --source actions \
      --in "$GITHUB_EVENT_PATH" \
      --out event.json
    # Note: --source actions is accepted as an alias; the stored value will be provenance.source: "action".
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

### Rules quick-start

Evaluate simple YAML/JSON rules during enrichment to emit composed events (`.composed[]`). This enables lightweight routing/triggers without extra services.

Minimal example using included samples:

```bash
# Offline mode (no GitHub API). May yield no matches if PR state
# like mergeability cannot be determined without API lookups.
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, labels})'

# Recommended: enable GitHub lookups for PR rules using PR state
export GITHUB_TOKEN=ghp_your_token_here
events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason, labels})'
```

See also:

- [Specs §6.1 Rule Engine and Composed Events](docs/specs/README.md#61-rule-engine-and-composed-events)
- [Full CLI reference](docs/cli/reference.md)

## Coverage (Optional)

Default (recommended) — GitHub Action

- Prefer the official Action in CI. Add a repo secret named `CODECOV_TOKEN` and include a guarded step after tests generate `coverage/lcov.info`:

```yaml
- name: Upload coverage to Codecov (optional)
  if: ${{ secrets.CODECOV_TOKEN != '' }}
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: coverage/lcov.info
    # flags: pr|push (optional)
    fail_ci_if_error: false
```

- Existing workflows already follow this Action-based approach and will upload when a token is present:
  - `.github/workflows/tests.yml` (push on `a5c/main` and `main`)
  - `.github/workflows/quick-checks.yml` (PRs)
  - `.github/workflows/pr-tests.yml` (PRs)
- If the token is absent, the step is skipped and CI remains green.

Alternative — Script-based uploader

- For local runs or non-GitHub CI, you may use a script uploader. If your setup includes a helper script (for example, `scripts/coverage-upload.sh`), call it after tests. Do not combine the script and the Action in the same workflow to avoid duplicate uploads.

Badge (optional)

After the first successful upload, add a badge to this README:

```
[![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://codecov.io/gh/a5c-ai/events)
```

Adjust the badge target for your repository or branch as needed. Private projects may require a tokenized badge per Codecov docs.

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

See also: CLI reference for flags and exit codes: `docs/cli/reference.md`.

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
  - CI Observability: see `.github/actions/obs-summary` and `.github/actions/obs-collector` composite actions which write a job summary and upload `observability.json`. Both composites set up Node via `actions/setup-node@v4` with default Node 20; override with `with.node-version` if needed. Example usage lives in `.github/workflows/tests.yml`.
    - Node requirement: the composites under `.github/actions/obs-*` execute Node inline scripts and ensure Node internally. You can optionally pre‑setup Node in your job if you want to control the toolchain:
      ```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      ```
  - CI runs lint and typecheck on PRs; see `.github/workflows/lint.yml` and `.github/workflows/typecheck.yml`.
- Local pre-commit enforces staged-file hygiene and runs lint-staged (ESLint + Prettier); see `docs/dev/precommit-hooks.md`. Conventional commits are validated via Husky + commitlint; see `docs/contributing/git-commits.md`.
- Minimal Node types + commander; TypeScript configured in `tsconfig.json`

### Node.js Version Policy

This project targets Node 20 LTS by default:

- Engines: `"node": ">=20"` in `package.json`
- Local: `.nvmrc` pins Node 20
- CI: workflows use `actions/setup-node@v4` with `node-version-file: '.nvmrc'`

Typecheck CI runs a matrix on Node 20 and 22 to catch version-specific type issues, but build/tests default to Node 20.

### Commit conventions

We follow Conventional Commits. Local commit messages are validated with Husky + commitlint, and PRs run a commitlint check. See `docs/contributing/git-commits.md`.

For local hooks and skip flags, see `docs/dev/precommit-hooks.md` and the pre-commit section in `CONTRIBUTING.md`.

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

You can enrich with rules to emit composed events and validate the enriched output against the NE schema. The `composed` field is part of the NE schema and optional; enriched documents validate as‑is. If you want to validate just the normalized subset, you may drop `.composed` before validation.

```bash
# Enrich with rules to produce `.composed[]`
events enrich --in samples/pull_request.synchronize.json   --rules samples/rules/conflicts.yml   --out enriched.json

# Inspect composed events (guard for absence; `reason` may be omitted)
jq '(.composed // []) | map({key, reason})' enriched.json

# Validate the enriched document against the NE schema (as‑is)
events validate --in enriched.json --schema docs/specs/ne.schema.json --quiet

# Option: validate the normalized‑only subset (drop `.composed`)
jq 'del(.composed)' enriched.json | events validate --schema docs/specs/ne.schema.json --quiet
```

Notes:

- `.composed` may be absent when no rules match. Use `(.composed // [])` in `jq`.
- NE schema: `docs/specs/ne.schema.json` includes optional top‑level `composed`. `payload` is `object | array`; `composed[].payload` may be `object | array | null`.
- `reason` is optional depending on rule configuration.

## Links

- Specs: `docs/specs/README.md`
- Issues: https://github.com/a5c-ai/events/issues
- Agent registry: https://github.com/a5c-ai/registry
