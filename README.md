[![99% built by agents](https://img.shields.io/badge/99%25-built%20by%20agents-blue.svg)](https://a5c.ai) [![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://app.codecov.io/gh/a5c-ai/events/tree/a5c/main)

# @a5c-ai/events – Events SDK & CLI

Normalize and enrich GitHub (and other) events for agentic workflows. Use the CLI in CI or locally to turn raw webhook/Actions payloads into a compact, consistent schema that downstream agents and automations can trust.

- Quick install via npm
- Commands: `events mentions`, `events normalize`, `events enrich`, `events reactor`, `events emit`, `events validate`, `events generate-context` (see `docs/cli/reference.md#events-reactor`, `docs/cli/reference.md#events-emit`, and `docs/cli/reference.md#events-generate-context` for options and examples)
- Output: JSON to stdout or file
- Extensible via provider adapters and enrichers

## Ownership & Routing

Semantics: enrichment computes `owners_union` as the sorted, de‑duplicated union of all CODEOWNERS across changed files. This differs from GitHub’s per‑file evaluation where the last matching rule wins. We use union semantics to enable broader, safer routing.

Learn more and see examples in `docs/routing/ownership-and-routing.md` (Semantics).

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

Programmatic SDK example:

- See SDK Quickstart: `docs/user/sdk-quickstart.md` (minimal example using `mapToNE` and optional `enrichGithub`).

Ref note (important):

- The NE schema defines `ref.type` as `branch | tag | unknown`. Pull request events use branch semantics and populate `ref.base` and `ref.head` with the base and head branch names respectively; there is no `pr` enum in `ref.type`.
- Canonical references: see the NE Schema overview at `docs/cli/ne-schema.md#ref` and the JSON Schema at `docs/specs/ne.schema.json`.

Normalized types (GitHub adapter): `workflow_run`, `pull_request`, `push`, `issue`, `issue_comment`, `check_run`, and now also `release`, `deployment`, `job` (from `workflow_job`), `step` (when granular), and `alert` (code/secret scanning).

## CI Checks

For CI guidance and required checks, see `docs/ci/ci-checks.md`.

Validate locally: `npm run -s validate:examples` (details in `docs/ci/ci-checks.md`).

Triggers matrix (summary):

- Pull requests → Quick feedback: `Quick Checks` (lint, typecheck, unit tests + coverage), `Lint`, `Typecheck`, `Commit Hygiene`, and `Tests` (lightweight; mirrors Quick Checks but uploads coverage artifacts).
- Push to protected branches (`a5c/main`, `main`) → Heavier gates: `Build`, `Tests` (full install/build/test with coverage artifacts).
- Branch semantics: `a5c/main` is development/staging; `main` is production.

## CLI Reference

Reactor: Apply rules to a normalized event and emit custom events — see `docs/cli/reference.md#events-reactor` for usage and examples.

### Mentions config (Quick Start)

For the full, canonical list of Mentions flags and defaults, see the CLI reference. Quick examples:

```bash
# Disable scanning of changed files (code‑comment mentions)
events enrich --in ... --flag 'mentions.scan.changed_files=false'

# Restrict by language allowlist (accepts canonical IDs or common extensions; inputs normalize to IDs)
events enrich --in ... --flag 'mentions.languages=ts,js'
```

Canonical reference and examples:

- docs/cli/reference.md#events-enrich
- docs/cli/reference.md#mentions-scanning

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
    - Accepts `actions` as input alias and persists `provenance.source: "action"`.
  - `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output (see CLI reference example: docs/cli/reference.md#events-normalize)
  - `--label <key=value...>`: attach labels to top‑level `labels[]` (repeatable)

`events enrich`

- Purpose: Add metadata and correlations to a normalized event.
- Common flags:
  - `--in <file>`: normalized event JSON (or raw payload; NE shell will be created)
  - `--out <file>`: write enriched result
  - `--rules <file>`: rules file path (yaml/json)
- `--flag include_patch=<true|false>`: include diff patches in files (default: false)
- `--flag commit_limit=<n>`: max commits to include (default: 50)
- Mentions scanning flags are documented once in the CLI reference at `docs/cli/reference.md#events-enrich` and are the canonical source of truth for wording and defaults.
- `--use-github`: enable GitHub API enrichment (requires `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`; `A5C_AGENT_GITHUB_TOKEN` takes precedence when both are set). For CI convenience, you may set `A5C_EVENTS_AUTO_USE_GITHUB=true` to auto-enable when a token is present; otherwise behavior remains offline by default.
- `--select <paths>`: comma-separated dot paths to include in output
  - `--filter <expr>`: filter expression `path[=value]`; if not matching, exits with code 2 and no output (see CLI reference example: docs/cli/reference.md#events-enrich)
- `--label <key=value...>`: attach labels to top‑level `labels[]`

#### Mentions flags

Canonical source: Mentions scanning flags and defaults are documented in the CLI reference. To avoid drift, this README links to the canonical list instead of duplicating it.

- docs/cli/reference.md#events-enrich
- docs/cli/reference.md#mentions-scanning

Quick examples:

```bash
# Disable scanning changed files for code‑comment mentions
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false

# Restrict to specific languages and lower the size cap
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.languages=ts,js \
  --flag mentions.max_file_bytes=102400
```

See also:

- Specs: `docs/specs/README.md#42-mentions-schema`
- CLI reference: `docs/cli/reference.md#events-enrich`

- Behavior:

- Offline by default: without `--use-github`, no network calls occur. Output includes `enriched.github` with `partial=true` and `reason="flag:not_set"`. See example outputs: `docs/examples/enrich.offline.json` and `docs/examples/enrich.online.json`.
- When `--use-github` is set but no token is configured, the CLI exits with code `3` (provider/network error) and prints an error; no JSON is emitted. For programmatic SDK usage and tests with an injected Octokit, a partial structure with `reason: "token:missing"` may be returned, but the CLI UX is exit `3`.

Exit codes: `0` success, non‑zero on errors (invalid input, etc.).

#### Offline GitHub enrichment

When you do not pass `--use-github`, enrichment runs without network calls. Two acceptable offline shapes exist:

- Minimal NE: omit `enriched.github` entirely (valid per schema; often used in minimal examples).
- CLI default stub: include `enriched.github` with `{ provider: 'github', partial: true, reason: <implementation-defined> }`.

The CLI currently uses the stub form; the exact `reason` string may evolve. See examples: `docs/examples/enrich.offline.stub.json`.

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

Notes:

- Minimal offline examples may omit `enriched.github`. Both shapes validate against the NE schema. See also: `docs/examples/enrich.offline.stub.json`.
  For detailed command usage and examples, see docs/cli/reference.md.

### Mentions scanning examples

Examples are centralized in the CLI Reference:

- docs/cli/reference.md#mentions-scanning

### Rules quick-start (composed events)

Note: The CLI Reference is the single source of truth for flags/options.

Define a minimal rule in YAML and evaluate it with `enrich --rules` to emit composed events. This example matches the included PR sample (`samples/pull_request.synchronize.json`) which carries a `documentation` label.

```bash
# 1) Create a tiny rules file
cat > rules.sample.yml <<'YAML'
rules:
  - name: pr_labeled_documentation
    on: pull_request
    when:
      all:
        - { path: "$.payload.pull_request.labels[*].name", contains: "documentation" }
    emit:
      key: pr_labeled_documentation
      reason: "PR has documentation label"
      targets: [developer-agent]
YAML

# 2) Enrich with rules and inspect composed outputs
events enrich --in samples/pull_request.synchronize.json \
  --rules rules.sample.yml \
  | jq '(.composed // []) | map({key, reason})'
```

Notes:

```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.max_file_bytes=102400 \
  --flag mentions.languages=ts,js
```

// Learn more links

- Real‑world rules can combine predicates (`all/any/not`, `eq`, `in`, `contains`, `exists`) and project fields into `emit.payload`. See the richer sample at `samples/rules/conflicts.yml`.
- When no rules match, `.composed` may be absent or `null`. Guard with `(.composed // [])` as shown.
- Learn more:
  - Specs §6.1: docs/specs/README.md#61-rule-engine-and-composed-events
  - CLI Reference — Events Reactor: docs/cli/reference.md#events-reactor

## Normalized Event Schema (MVP)

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
- `provenance`: `{ source: action|webhook|cli, workflow? }` (no labels here). Note: CLI accepts `--source actions` but normalizes to `action` in output.

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
jq '.type, .repo.full_name, .labels' event.json

### Enrichment examples

- Offline (includes minimal `enriched.github` stub): `docs/examples/enrich.offline.json`
- Online (includes minimal `enriched.github`): `docs/examples/enrich.online.json`

Both examples conform to the NE schema (`docs/specs/ne.schema.json`) and are validated in CI.
```

Local payload file:

```bash
events normalize --in samples/pull_request.synchronize.json \
  --out out.json
jq '.type, .labels' out.json
```

Enrichment (offline vs online):

```bash
# Offline (default; no network calls)
events enrich --in samples/pull_request.synchronize.json --out enriched.offline.json
jq '.enriched.github // { partial: "offline" }' enriched.offline.json

# Online (GitHub enrichment; requires token)
export GITHUB_TOKEN=ghp_your_token_here
events enrich --in samples/pull_request.synchronize.json \
  --flag include_patch=false --flag commit_limit=50 --flag file_limit=200 \
  --use-github --out enriched.online.json
jq '.enriched.github.provider' enriched.online.json
```

With rules (composed events):

```bash
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
  # note: `reason` may be omitted depending on rule configuration
```

See also sample outputs:

- docs/examples/enrich.offline.json
- docs/examples/enrich.online.json

## Coverage (Optional)

You can optionally upload coverage to Codecov. This repo does not enable uploads by default.

Opt-in steps (aligned with `docs/ci/ci-checks.md`):

- Define `CODECOV_TOKEN` via repo/org Secret or Variable.
- Use the guarded upload step after coverage is generated:

```yaml
env:
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || '' }}

- name: Upload coverage to Codecov (optional)
  if: ${{ env.CODECOV_TOKEN != '' }}
  uses: codecov/codecov-action@v4
  with:
    token: ${{ env.CODECOV_TOKEN }}
    files: coverage/lcov.info
    flags: pr
    fail_ci_if_error: false
```

Alternatively, use the repo script:

```yaml
env:
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || '' }}

- name: Upload coverage to Codecov (optional)
  if: ${{ env.CODECOV_TOKEN != '' }}
  run: bash scripts/coverage-upload.sh
```

Note: The Codecov badge at the top links to the tree view for `a5c/main`: https://app.codecov.io/gh/a5c-ai/events/tree/a5c/main

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

# Missing token with --use-github: exits 3
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

See also: CLI reference for flags and exit codes: `docs/cli/reference.md`. Cross‑link: `docs/cli/code-comment-mentions.md` and specs §4.2 in `docs/specs/README.md`.

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
# Default include_patch is false; enable it explicitly only if you need diff bodies
events enrich --in samples/pull_request.synchronize.json \
  --flag commit_limit=50 --flag file_limit=200 \
  --use-github --out enriched.json
jq '.enriched' enriched.json

# To include patch diffs, opt in explicitly:
events enrich --in samples/pull_request.synchronize.json \
  --flag include_patch=true --use-github | jq '.enriched.github.pr.files[0].patch'
```

With rules (composed events):

```bash
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
  # note: `reason` may be omitted depending on rule configuration
```

## Coverage (Optional)

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

For thresholds and how PR feedback works, see `docs/ci/coverage.md`.

After the first successful upload, add a badge to this README:

```
[![codecov](https://codecov.io/gh/a5c-ai/events/branch/a5c/main/graph/badge.svg)](https://codecov.io/gh/a5c-ai/events)
```

Replace the URL to match your VCS provider and repository if different. Private projects may require a tokenized badge; see Codecov docs.

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
