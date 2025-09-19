---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`, `reactor`, `emit`, `validate`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE), extracts mentions, can enrich with repository context, and can apply a reactor to generate custom events. Implemented with `commander` (see `src/cli.ts`).

## Global Flags

These flags can be used with any subcommand and affect logging across the CLI:

- `--log-level <info|debug|warn|error>` — maps to env `A5C_LOG_LEVEL`.
- `--log-format <pretty|json>` — maps to env `A5C_LOG_FORMAT`.

Defaults: `info` level and `pretty` format. In CI, prefer `--log-format=json` for structured logs.

## Commands

### `events parse`

Parse streamed stdout logs into JSON events (stdin→stdout). Each input line is processed incrementally; the command writes one compact JSON object per parsed event line and flushes any buffered event at EOF.

Status: experimental; subject to change as parsers evolve.

Usage:

```bash
events parse --type <name>
```

Flags:

- `--type <name>`: parser type. Supported: `codex`.

Behavior (codex):

- Expects timestamped sections like `[YYYY-MM-DDTHH:MM:SS] thinking`, `exec <cmd> in <cwd>`, and result lines (e.g., `cmd succeeded in 123ms:`).
- Emits objects with shape: `{ type, timestamp, raw, fields? }` (fields vary by subtype, e.g., `tokens_used`, `exec`, `exec_result`, `thinking`, `codex`, `banner`).
- Streams: writes one JSON object per event line to stdout; trailing buffered content is flushed on EOF.

Examples:

```bash
# Pipe provider logs into the parser and pretty-print
my-codex-cli 2>&1 \
  | events parse --type codex \
  | jq '.type, .timestamp, .fields // {}'

# From a saved log file
cat /tmp/codex-session.log \
  | events parse --type codex \
  | jq -c . > /tmp/codex.events.jsonl
```

Exit codes:

- `0`: success
- `2`: unsupported `--type` or input/validation error specific to this command
- `1`: unexpected failure

Notes:

- The `codex` parser is designed for human-oriented stdout from Codex-like CLIs. It is not a generic JSON log parser.

### `events version`

Print the CLI/package version. Same value as `--version`.

Usage:

```bash
events version [--json]
```

- `--json`: print `{ "version": "x.y.z" }`

Examples:

```bash
events version
events version --json | jq -r .version
```

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
events normalize [--in FILE] [--out FILE] [--source <action|webhook|cli>] \
  [--label KEY=VAL...] [--select PATHS] [--filter EXPR]
```

- `--in FILE`: path to a JSON webhook payload
- `--out FILE`: write result JSON (stdout if omitted)
- `--source <name>`: provenance source (`action|webhook|cli`) [default: `cli`]
  - Alias: the CLI also accepts `actions` as input for convenience (e.g., in GitHub Actions). It is normalized and persisted as `provenance.source: "action"`.
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

# Non-matching filter exits with code 2 (no output)
events normalize --in samples/workflow_run.completed.json \
  --filter 'type=push' >/dev/null || echo $?
# prints: 2
```

Notes:

- `--select` and `--filter` are implemented and applied after normalization.

Supported provider → NE types (GitHub): `workflow_run`, `pull_request`, `push`, `issue`, `issue_comment`, `check_run`, plus `release`, `deployment` (from `deployment`/`deployment_status`), `job` (from `workflow_job`), `step` (when granular step context exists), and `alert` (e.g., code/secret scanning alerts). GitHub `repository_dispatch` is normalized as `type: custom` with `payload.action` and `payload.client_payload` preserved.

### `events generate-context`

Render a prompt/context document from a root template with lightweight templating and includes, using a normalized event (or raw payload) as input. The command name in the CLI is `generate_context` (underscore); this reference uses `generate-context` for readability.

Usage:

```bash
events generate_context \
  [--in FILE] \
  --template <uri> \
  [--out FILE] \
  [--var KEY=VAL ...] \
  [--token STRING]
```

Flags:

- `--in FILE`: input JSON file (NE or raw provider payload). If omitted, reads from stdin.
- `--template <uri>`: root template URI. Supports `file://` and `github://owner/repo/ref/path/to/file` schemes, and relative file paths.
- `--out FILE`: write rendered output to file (default: stdout).
- `--var KEY=VAL` (repeatable): extra template variables available under `vars.KEY`.
- `--token STRING`: GitHub token used for `github://` URIs. Defaults to `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN` when not provided explicitly.

Templating features:

- Variables: `{{ expr }}` with a small JS expression scope. Available names: `event` (alias `github`), `env`, `vars`, and `include(uri)`.
- Conditionals: `{{#if expr}}...{{/if}}`
- Each loop: `{{#each expr}}...{{/each}}` with the current item bound to `this` (use `{{ this }}` or `{{ this.prop }}`).
- Includes: `{{> uri key=value }}` — renders another URI with optional additional `vars` merged.
- URI interpolation: `$ {{ ... }}` inside URIs, for example `{{> github://a5c-ai/events/${{ env.BRANCH || 'a5c/main' }}/docs/cli/reference.md }}`.

Notes and safety:

- Expressions are evaluated in-process for convenience; avoid rendering untrusted templates.
- When using `github://...`, a token is required for private repos and recommended for public repos to avoid rate limits. Provide `--token` or set `A5C_AGENT_GITHUB_TOKEN`/`GITHUB_TOKEN`.

Examples:

1. Local files (input file and template from disk):

```bash
# Prepare a tiny template and event file
cat > /tmp/main.md <<'MD'
Hello {{ event.repo?.full_name || event.repository?.full_name }}
{{#if env.USER}}User: {{ env.USER }}{{/if}}
Labels: {{#each event.labels}}{{ this }} {{/each}}
Include:
{{> file:///tmp/part.md name=World }}
MD
echo 'Part {{ vars.name }}!' > /tmp/part.md

# Use a sample payload from the repo
cp samples/pull_request.synchronize.json /tmp/event.json

events generate_context --in /tmp/event.json --template file:///tmp/main.md
```

2. Stdin/stdout pipeline:

```bash
cat samples/pull_request.synchronize.json \
  | events generate_context --template file:///tmp/main.md \
  | sed -n '1,5p'
```

3. Template from GitHub (github:// URI):

```bash
# Render this repo's README.md with minimal interpolation
export GITHUB_TOKEN="${GITHUB_TOKEN:-$A5C_AGENT_GITHUB_TOKEN}"
events generate_context \
  --in samples/pull_request.synchronize.json \
  --template github://a5c-ai/events/a5c/main/README.md \
  | head -n 10
```

Troubleshooting:

- Missing token for `github://...` may fail with an authentication or rate-limit error. Provide `--token` or export `A5C_AGENT_GITHUB_TOKEN`/`GITHUB_TOKEN`.
- If a `github://owner/repo/ref/path` points to a directory, an error is returned; provide a file path.
- For private repos, ensure the token has `repo` scope.
- Refs that contain slashes (e.g., `a5c/main`) are supported without URL-encoding. For maximum compatibility with older versions, you may also URL-encode the slash (`a5c%2Fmain`).

### `events enrich`

Enrich a normalized event (or raw GitHub payload) with repository and provider metadata.

Recommended flow

- Normalize first, then enrich. This produces predictable NE fields and avoids the minimal shell fallback when passing raw payloads directly to `enrich`.

Example pipeline:

```bash
events normalize --in samples/pull_request.synchronize.json \
  | events enrich --out enriched.json
```

See also:

- Normalization reference: `docs/cli/reference.md#events-normalize` (including `--source actions` usage in GitHub Actions)

Behavior:

- Pass `--use-github` to enable GitHub API enrichment. If no token is configured, the CLI exits with code `3` (provider/network error) and prints an error (no JSON is emitted by the CLI path). Token precedence: `A5C_AGENT_GITHUB_TOKEN` is preferred over `GITHUB_TOKEN` when both are set.
- Offline by default: no network calls without `--use-github`. Output includes a minimal stub under `enriched.github`:

> Offline states

- Offline (flag not set): `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }`
- Requested but missing token: `reason: 'token:missing'` and the CLI exits with code `3` (no JSON output).

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

  Note: Some older docs or validation notes may reference a legacy offline reason value. The canonical offline reason is `flag:not_set` and is treated as a stable contract across minor releases.

- Online enrichment: pass `--use-github` with a valid token to populate fields like `enriched.github.pr.mergeable_state`, `enriched.github.pr.files[]`, `enriched.github.branch_protection`, etc.
- Missing token with `--use-github`: the CLI exits with code `3` (provider/network error) and prints an error message; no JSON is written.

Usage:

```bash
events enrich --in FILE [--out FILE] [--rules FILE] \
  [--flag KEY=VAL...] [--use-github] [--label KEY=VAL...] \
  [--select PATHS] [--filter EXPR]
```

- `--in FILE`: input JSON (normalized event or raw GitHub payload)
  - If omitted, and `GITHUB_EVENT_PATH` is set (as in GitHub Actions), `events enrich` reads from that path by default. This mirrors the convenience of using `normalize --source actions` in workflows.
- `--out FILE`: write result JSON (stdout if omitted)
  - `--rules FILE`: YAML/JSON rules file (optional). When provided, matching rules emit `composed[]` with `{ key, reason, targets?, labels?, payload? }`.
  - `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
    - `include_patch=true|false` (default: `false`) – include diff patches; when `false`, patches are removed. Defaulting to false avoids leaking secrets and keeps outputs small; enable only when required.
    - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
    - `file_limit=<n>` (default: `200`) – limit files per compare list
    - Mentions scanning: see the dedicated subsection below for `mentions.*` controls
  - `--use-github`: enable GitHub API enrichment; equivalent to `--flag use_github=true` (requires `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`). See Behavior above for semantics and exit codes.
  - Escape hatch for CI convenience: set environment variable `A5C_EVENTS_AUTO_USE_GITHUB=true` to auto‑enable GitHub enrichment when a token is present (no effect if no token). Default remains offline unless `--use-github` is explicitly provided.
- `--label KEY=VAL...`: labels to attach
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`

Input default in GitHub Actions:

- If `--in` is omitted, the CLI reads from `GITHUB_EVENT_PATH` when set (GitHub Actions). This mirrors `normalize --source actions` behavior. When the env var is missing, the CLI exits with code `2` and prints a clear error.

Example (omitting `--in` in Actions):

```yaml
jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx @a5c-ai/events enrich --use-github --out enriched.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Mentions scanning

- `mentions.scan.changed_files=true|false` (default: `true`) – when `true`, scan changed files' patches for `@mentions` within code comments and add to `enriched.mentions[]` with `source="code_comment"` and `location` hints.
- `mentions.scan.commit_messages=true|false` (default: `true`) – enable/disable scanning commit messages for `@mentions`.
- `mentions.scan.issue_comments=true|false` (default: `true`) – enable/disable scanning issue comment bodies for `@mentions`.
  - `mentions.max_file_bytes=<bytes>` (default: `204800` ≈ 200KB) – skip scanning any single file larger than this cap.
  - `mentions.languages=<lang,...>` (optional) – only scan files whose detected language matches the allowlist. Accepted values are canonical IDs and common extensions (with/without a leading dot); inputs normalize to IDs. Canonical IDs: `js, ts, py, go, java, c, cpp, sh, yaml, md`.

Language allowlist details (inputs normalize to IDs):

- Accepted language IDs and common extensions detected → ID
  - `.js, .mjs, .cjs, .jsx` → `js`
  - `.ts, .tsx` → `ts`
  - `.py` → `py`
  - `.go` → `go`
  - `.java` → `java`
  - `.c, .h` → `c`
  - `.cc, .cpp, .cxx, .hpp, .hh` → `cpp`
  - `.sh, .bash, .zsh` → `sh`
  - `.yaml, .yml` → `yaml`
  - `.md, .markdown` → `md`

Notes:

- You can provide canonical language IDs or common extensions, with or without a leading dot. All inputs are normalized to IDs. Examples: `--flag mentions.languages=ts,js,md`, `--flag mentions.languages=.tsx,.yml`.
- You don’t need to list JSX/TSX/YML explicitly when the corresponding ID is present; detection maps them to `js`/`ts`/`yaml` automatically.

Examples:

````bash
export GITHUB_TOKEN=...  # required for GitHub API lookups

events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  | jq '.enriched.github.pr.mergeable_state'

# Mentions scanning controls
# Disable scanning entirely
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.scan.changed_files=false | jq '.enriched.mentions // [] | length'

# Disable commit and/or issue comment scanning
events enrich --in samples/push.json \
  --flag 'mentions.scan.commit_messages=false' | jq '.enriched.mentions // [] | map(select(.source=="commit_message")) | length'

events enrich --in samples/issue_comment.created.json \
  --flag 'mentions.scan.issue_comments=false' | jq '.enriched.mentions // [] | map(select(.source=="issue_comment")) | length'

# Restrict by languages and cap bytes (use canonical language IDs; tsx/jsx map automatically)
events enrich --in samples/pull_request.synchronize.json \
  --flag mentions.languages=ts,js \
  --flag mentions.max_file_bytes=102400 \
  | jq '.enriched.mentions // [] | map(select(.source=="code_comment")) | length'

## GitHub Actions without --in

In GitHub Actions, `GITHUB_EVENT_PATH` points to the triggering event payload. You can omit `--in` and pipe from `normalize` or pass the raw event directly:

```yaml
jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Enrich event (auto-reads GITHUB_EVENT_PATH)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Option A: normalize then enrich (recommended)
          events normalize --source actions | events enrich --use-github | jq '.enriched.github.provider'

          # Option B: pass raw payload directly (minimal fallback if not normalized first)
          events enrich --use-github | jq '.type'
```

## Mentions from GitHub Issues

For `issues.*` payloads, `events enrich` extracts mentions from both the issue title and body when present.

Example:

```bash
cat > /tmp/issue.json <<'JSON'
{ "action": "opened", "issue": { "title": "Ping @developer-agent", "body": "Please review, @validator-agent" }, "repository": { "full_name": "a5c-ai/events" } }
JSON

events enrich --in /tmp/issue.json | jq '.enriched.mentions | map({source, target})'
# → [{"source":"issue_title","target":"@developer-agent"}, {"source":"issue_body","target":"@validator-agent"}]
````

# With rules (composed events)

```bash
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
```

# JSON rules are also supported via the same `--rules` flag:

```bash
events enrich --in samples/pull_request.synchronize.json \
  --rules samples/rules/conflicts.json \
  | jq '(.composed // []) | map({key, reason})'
```

# Non-matching filter exits with code 2 (no output)

```bash
events enrich --in samples/pull_request.synchronize.json \
  --filter 'type=push' >/dev/null || echo $?
# prints: 2
```

Mentions sources:

- Allowed values for `mentions[].source`: `commit_message`, `pr_title`, `pr_body`, `issue_title`, `issue_body`, `issue_comment`, `code_comment`.
- Mentions discovered within diffs/changed files are emitted as `source: code_comment` with `location.file` and `location.line` populated. There is no distinct `file_change` source.

Mentions sources for GitHub Issues:

- When the input is a GitHub `issues.*` webhook payload (or an NE of type `issue`), the enrich step also extracts `@mentions` from:
  - `issue.title` → entries with `source: "issue_title"`
  - `issue.body` → entries with `source: "issue_body"`

These are included under `enriched.mentions` and are deduplicated by normalized target and location on a per‑source basis. The same target may appear once for `issue_title` and once for `issue_body` when present in both.

Note:

- `.composed` may be absent or `null` when no rules match. Guard with `(.composed // [])` as above.
- The `reason` field may be omitted depending on rule configuration. See specs §6.1 for composed events structure: `docs/specs/README.md#61-rule-engine-and-composed-events`.
- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Programmatic API nuance: when using the SDK directly and `--use-github` semantics are requested without a token, some code paths may return a partial `enriched.github` with `reason: 'token:missing'` for testing with an injected Octokit. The CLI path exits with code `3` and does not emit JSON.
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).

````

Outputs:

- When enriching a PR with `--use-github`, the CLI exposes per-file owners under `enriched.github.pr.owners` and the deduplicated, sorted union of all CODEOWNERS across changed files under `enriched.github.pr.owners_union`.

Without network calls (mentions only):

```bash
events enrich --in samples/push.json --out out.json
jq '.enriched.mentions' out.json
````

Include patch diffs explicitly (opt‑in):

```bash
events enrich --in samples/pull_request.synchronize.json \
  --use-github --flag include_patch=true \
  | jq '.enriched.github.pr.files | map(has("patch")) | all'
```

Inspect composed if present:

```bash
# Given prior command output on stdin
jq '(.composed // []) | map({key, reason})'
```

### `events generate_context`

Render a prompt/context file from templates and event context. Supports local files and `github://` URIs, basic templating (`{{ expr }}`, `{{#if}}`, `{{#each}}`, and partials `{{> uri }}`), and variable injection via `--var`.

Usage:

```bash
events generate_context [--in FILE] --template <uri> [--out FILE] [--var KEY=VAL...] [--token STRING]
```

- `--in FILE`: input JSON event (defaults to stdin when omitted)
- `--template <uri>`: root template URI (file path or `github://owner/repo/ref/path`)
- `--out FILE`: write output to file (defaults to stdout)
- `--var KEY=VAL...`: additional template variables (repeatable). Inside templates, variables are available under `vars.*` and the input event under `event.*`.
- `--token STRING`: GitHub token for `github://` includes (defaults to `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`)

Examples:

```bash
# Local file input to stdout
events generate_context --in samples/pull_request.synchronize.json \
  --template docs/examples/context.md

# Pipe normalized event and write to file
events normalize --in samples/pull_request.synchronize.json \
  | events generate_context --template docs/examples/context.md --out out.md

# Include a file from GitHub at a specific ref
events generate_context --in samples/push.json \
  --template 'github://a5c-ai/events/main/docs/examples/context.md'
```

Notes:

- Template expressions support `{{ expr }}` with access to `event`, `env`, `vars`, and an `include(uri)` helper. Use `{{#each}}` to iterate arrays (current item available as `{{ this }}`).
- For GitHub includes, pass a token via `--token` or env (`A5C_AGENT_GITHUB_TOKEN` preferred).

### `events reactor`

Apply reactor rules to a Normalized Event and produce custom events. Reads from stdin by default; writes to stdout unless `--out` is provided. Rules are YAML; multiple YAML documents in a single file are supported.

Usage:

```bash
events reactor [--in FILE] [--out FILE] [--file PATH]
```

- `--in FILE`: input JSON file path (default: stdin)
- `--out FILE`: output JSON file path (default: stdout)
- `--file PATH`: reactor rules file path (YAML). Default: `.a5c/events/reactor.yaml`

Rules structure (YAML):

```yaml
# One or more YAML documents, each with `on` and `emit` keys
on: <event-name | map | list>
emit:
  <custom_event_type>:
    type: <string> # optional
    phase: <string> # optional
    labels: [<string>...] # optional
    payload: # optional; supports template expressions
      key: "${{ ne.type }}"
```

Trigger matching:

- `on` accepts:
  - GitHub event names like `push`, `pull_request`, `issues`, `issue_comment`, `workflow_run`, `repository_dispatch`.
  - Custom event names (e.g., `my_event`) matched against the input action or `client_payload.event_type`.
  - A mapping form for more control: `on: { pull_request: { types: [opened, synchronize], labels: [documentation] } }`.
  - Lists or single strings: `on: [pull_request, issues]`.
- Filters supported in mapping form:
  - `types: [subactions...]` – for GitHub events (e.g., `opened`, `synchronize`).
  - `events: [event_type...]` – for `repository_dispatch` event types.
  - `labels: [label...]` – requires all labels; uses NE `labels[]` for GH events or `client_payload.labels` for custom events.
  - `phase: <string | [..]>` – matches `payload.phase` or `client_payload.phase` for custom events.

Templating:

- `emit.*.payload` supports simple template strings of the form `${{ <js expression> }}` evaluated with:
  - `event` – the raw payload (`ne.payload`)
  - `ne` – normalized wrapper `{ provider?, type?, payload, labels[], enriched? }`
  - `env` – `process.env`
    If evaluation fails, the value becomes `null`.

Output shape:

```json
{
  "events": [
    {
      "event_type": "custom.name",
      "client_payload": {
        /* from emit spec */
      }
    }
  ]
}
```

Exit codes:

- `0`: success
- `1`: failure (invalid input JSON, missing/invalid rules file, YAML parse error)

Examples:

```bash
# Defaults: stdin -> stdout, rules at .a5c/events/reactor.yaml
cat samples/pull_request.synchronize.json | events reactor

# Explicit files
events reactor --in samples/pull_request.synchronize.json \
  --file samples/reactor/sample.yaml \
  --out out.events.json

# Minimal rules file with two documents (---):
cat > .a5c/events/reactor.yaml <<'YAML'
on: pull_request
emit:
  a5c.reviewer.ping:
    labels: [documentation]
    payload:
      pr: "${{ event.pull_request.number }}"
---
on: repository_dispatch
emit:
  a5c.pipeline.phase:
    payload:
      phase: "${{ event.client_payload.phase }}"
YAML

events reactor --in samples/pull_request.synchronize.json | jq '.events | length'
```

Notes:

- Reactor parses multiple YAML docs via `yaml.parseAllDocuments` and accumulates emitted events from all matching documents.
- Default rules path is `.a5c/events/reactor.yaml` when `--file` is omitted.
- Custom event names in `on:` match against the input action or `client_payload.event_type`.

### `events emit`

Emit an event or `{ events: [...] }` collection to a sink. Before emitting, `events emit` can optionally perform side-effects (labels, status checks, scripts). Output is redacted.

Usage:

```bash
events emit [--in FILE|-] [--out FILE] [--sink <stdout|file|github>]
```

- `--in FILE` (or `-`): read input from file or stdin (default when omitted)
- `--out FILE`: write to file when `--sink file` (or when `--out` is provided without `--sink`)
- `--sink`: one of:
  - `stdout` (default): pretty-print redacted JSON
  - `file`: write to `--out`
  - `github`: dispatch as `repository_dispatch` via GitHub API

GitHub sink behavior (only when selected):

- Auth: `A5C_AGENT_GITHUB_TOKEN` preferred, or `GITHUB_TOKEN`.
- Repo resolution (inferred from payload):
  - `client_payload.repository.full_name` or `repo_full_name`
  - common `html_url` fields (PR/Issue/Repo) via URL parsing
  - nested `original_event.repository.full_name` or related `html_url`
    If no owner/repo can be resolved, the event is skipped with a stderr note.
- Event fields mapping:
  - `event_type`: `event.event_type || event.type || "custom"`
  - `client_payload`: `event.client_payload || event.payload || event`
- Collections: if the input is `{ events: [...] }`, each is dispatched.

Side-effects (executed before emitting):

- `pre_set_labels`: add/remove labels before scripts
- `status_checks`: create commit status checks (Queued → Success/Failure)
- `script`: run shell commands with `A5C_EVENT_PATH` pointing to a temp JSON file of the current event; inherits env and `A5C_PKG_SPEC`
- `set_labels`: add/remove labels after scripts

Notes:

- Redaction masks common secrets (see `src/utils/redact.ts`).
- Supplying `--out` without `--sink` implies `--sink file`.

Side-effects

`events emit` can perform side-effects before writing to the sink. Side-effects run in this order: `pre_set_labels` → `script` → `set_labels`. If any step fails, the command exits with code `1`.

- Enable by including fields under the top-level object or under each item of `events[]` (the code treats both a single object or `{ events: [...] }`). Side-effects use `client_payload || payload || <event>` as their working context.
- Use `event_type: "command_only"` to run side-effects without dispatching anything when `--sink github` is used (the GitHub sink skips dispatch for this event type).

Supported side-effects (per `src/emit.ts`):

- `pre_set_labels[]`: add/remove labels before `script` runs.
  - Shape: `{ entity: <issue/pr URL>, add_labels?: string|string[], remove_labels?: string|string[] }`
  - `entity` can be any supported Issue/PR URL, e.g.: `https://github.com/owner/repo/issues/123` or `https://github.com/owner/repo/pull/456`.
  - If labels do not exist, they are auto-created with a deterministic color.
  - Requires `GITHUB_TOKEN` (or `A5C_AGENT_GITHUB_TOKEN`).

- `script[]`: array of shell commands executed with `sh -c`, inheriting env (see below). Template expressions in commands are supported:
  - `${{ <js expression> }}` and `{{ <js expression> }}` are evaluated with arguments `(event, env, event_path)`, where `event` is the working client payload, `env` is the merged environment, and `event_path` is a temp JSON file path containing the current event.
  - Example: `echo "Hello ${{ event.actor?.login || 'unknown' }}"`.
  - Fail-fast: a non-zero exit from any command fails the step; commit status checks (when configured) are marked `failure`.

- `set_labels[]`: add/remove labels after `script` completes.
  - Same shape and requirements as `pre_set_labels`.

- `status_checks[]`: optional GitHub commit status checks created before `script` and completed after it finishes.
  - Shape: `{ name: string, description?: string }`
  - Resolution: determines the target repo via `resolveOwnerRepo` (from fields like `repository.full_name`, nested payload URLs, or label target URLs). Determines the commit SHA via `pull_request.head.sha`, `sha`, or the default branch head when not present.
  - Behavior: creates each status with `state=queued` before `script`, and updates to `success` or `failure` based on `script` result.
  - Requires `GITHUB_TOKEN` (or `A5C_AGENT_GITHUB_TOKEN`).

Script environment (available to `script[]` commands):

- `EVENT_PATH` / `A5C_EVENT_PATH`: path to a temp JSON file of the current event (first tries `/tmp/a5c-event.json`, then `$RUNNER_TEMP/$TEMP`, then CWD).
- `A5C_TEMPLATE_URI`: propagated from payload env (`client_payload.env.A5C_TEMPLATE_URI`) or process env; empty when unset.
- `A5C_PKG_SPEC`: package spec to re-enter the CLI if needed (defaults to `@a5c-ai/events` when not set).
- `A5C_STATUS_CHECKS`: when status checks are configured and a token is available, a comma-separated list of `sha-context` pairs for all checks created.

Examples (side-effects):

Offline, `script` only (safe locally):

```bash
events emit --in docs/examples/emit.side-effects.offline.json
```

With labels and status checks (requires token, repository context in payload):

```bash
export GITHUB_TOKEN=ghp_...
events emit --in docs/examples/emit.side-effects.github.json
```

Examples:

```bash
# Default sink: stdout
events emit --in out.reactor.json

# File sink
events emit --in out.reactor.json --sink file --out /tmp/out.json

# GitHub sink
export GITHUB_TOKEN=...
events emit --in out.reactor.json --sink github
```

Exit codes:

- `0`: success
- `1`: error (I/O, JSON parse, missing `--out` for file sink, or GitHub dispatch failure)

### `events parse`

Parse streamed logs into structured events. Currently supports Codex-style streaming output.

Usage:

```bash
events parse --type codex < session.log > events.json
```

Emitted event types:

- `user_instructions_event`, `tokens_used`, `thinking`, `codex`, `exec`, `exec_result`, `banner`.

Fields:

- All events include `timestamp`, `type`, `raw`. When applicable, `fields` carries parsed metadata (e.g., `exec` → `{ command, cwd }`; `exec_result` → `{ command, status, durationMs, exitCode? }`; `banner` → key-value pairs and `version`).

Example:

```bash
codex run ... | tee session.log
cat session.log | events parse --type codex | jq 'map(.type) | group_by(.) | map({type: .[0], count: length})'
```

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

### `events run`

Run an AI provider CLI from a predefined profile. Profiles and provider command templates are defined in `predefined.yaml` (bundled with the package). You can optionally provide a config that partially overrides `predefined.yaml`.

Status: experimental (interfaces and defaults may evolve).

Usage:

```bash
events run \
  [--in <uri-or-path|->] \
  [--out FILE] \
  [--profile NAME] \
  [--model NAME] \
  [--mcps FILE] \
  [--config <uri-or-path>]
```

Options:

- `--in <uri-or-path|->`: prompt input. Supports `file://`, `github://owner/repo/ref/path`, plain paths, and `-` for stdin (default when omitted).
- `--out FILE`: write the final message/content to this file. When omitted, the provider’s last-message temp file remains in a temp dir. Default internal path: `/tmp/events-run-out.json`.
- `--profile NAME`: profile key from `profiles` in the config (defaults to the profile marked `default: true`, or the first profile).
- `--model NAME`: override the model declared on the selected profile.
- `--mcps FILE`: path to MCPs config (default: `.a5c/mcps.json`).
- `--config <uri-or-path>`: a YAML file that overrides sections of `predefined.yaml`. Supports `file://` and `github://`.

Provider and profiles format (excerpt from `predefined.yaml`):

```yaml
cli:
  codex:
    cli_command: "cat {{prompt_path}} | codex exec --dangerously-bypass-approvals-and-sandbox -c model={{model}} --output-last-message {{output_last_message_path}}"
    install: "npm install -g @openai/codex@0.31.0"
  claude_code:
    cli_command: "cat {{prompt_path}} | claude --mcp-config {{mcp_config}} -p 'fulfill the request' --output-format stream-json --allowedTools Bash,Read,Glob,Grep,Write,MultiEdit,Edit,NotebookRead,NotebookEdit,WebFetch,TodoRead,TodoWrite,WebSearch,Task,Agent,mcp__github,mcp__agent_reporter --dangerously-skip-permissions --verbose --model {{model}}"
    install: "npm install -g @anthropic-ai/claude-code"
profiles:
  openai_codex_gpt5:
    default: true
    cli: codex
    model: gpt-5-2025-08-07
  claude_code_sonnet4:
    cli: claude_code
    model: claude-sonnet-4-20250514
```

Examples:

1. Minimal (use default profile), prompt from file, write output to `out.md`:

```bash
events run --in file://./prompt.md --out out.md
```

2. Override model, use explicit profile, and supply MCP settings:

```bash
events run \
  --in file://./prompt.md \
  --out out.md \
  --profile openai_codex_gpt5 \
  --model gpt-5 \
  --mcps .a5c/mcps.json
```

3. Read prompt from GitHub, override config via `--config` also from GitHub:

```bash
events run \
  --in github://a5c-ai/events/a5c/main/docs/examples/prompt.md \
  --config github://a5c-ai/events/a5c/main/predefined.yaml \
  --out out.md
```

Notes and behavior:

- On first use, the selected provider may run an `install` command (e.g., `npm install -g @openai/codex`). This is executed automatically before invoking the provider CLI.
- The CLI writes the provider’s “last message” to a temp file, and copies it to `--out` when provided.
- `github://` URIs require a token (`A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`).
- This command is a convenience wrapper; provider flags may change independently of this CLI. Treat as a workflow helper rather than a stable API surface.

## Global Options

- `--help`: show command help
- `--version`: print version

## Exit Codes

- `0`: success
- `1`: generic error (unexpected failure writing output, etc.)
- `2`: input/validation error (missing `--in` where required, invalid/parse errors, filter mismatch, missing `GITHUB_EVENT_PATH` when `--source actions`)
- `3`: provider/network error (only when `--use-github` is requested and API calls fail or token is missing)

## Notes

- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are set (see `src/config.ts`).
- Redaction: CLI redacts sensitive keys and common secret patterns in output by default (see `src/utils/redact.ts`).
  - Sensitive keys include: `token`, `secret`, `password`, `passwd`, `pwd`, `api_key`, `apikey`, `key`, `client_secret`, `access_token`, `refresh_token`, `private_key`, `ssh_key`, `authorization`, `auth`, `session`, `cookie`, `webhook_secret`.
  - Pattern masking includes (non-exhaustive): GitHub PATs (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghe_`), JWTs, `Bearer ...` headers, AWS `AKIA...`/`ASIA...` keys, Stripe `sk_live_`/`sk_test_`, Slack `xox...` tokens, and URL basic auth (`https://user:pass@host`).

Offline vs token-missing notes:

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

With --use-github but token missing (exit code 3): the CLI exits with status `3` and prints an error to stderr; no JSON is emitted. For programmatic SDK usage with an injected Octokit, some paths may return a partial object with `reason: "token:missing"`, but the CLI UX remains exit `3` with no JSON.
Offline and token-missing behavior:

- Offline (no `--use-github`): CLI emits a stub — see `docs/examples/enrich.offline.stub.json`.
- `--use-github` but token missing: CLI exits with code `3` and prints an error to stderr; it does not emit JSON. Programmatic API paths may return a partial object with `reason: "token:missing"` when an injected Octokit is used in tests.

References:

- Specs §5.1 environment precedence: docs/specs/README.md#51-environment-variables-and-precedence
- Tests: tests/enrich.basic.test.ts and goldens under tests/fixtures/goldens/\*.enrich.json

- Tests: See `test/config.loadConfig.test.ts`, `test/redact.test.ts`, `test/enrich.redaction.test.ts`, `test/config.precedence.test.ts`, and additional cases under `tests/` for coverage and regression fixtures.
- Large payloads: JSON is read/written from files/stdin/stdout; providers may add streaming in future.

See also: `docs/specs/README.md`. Technical specs reference for token precedence: `docs/producer/phases/technical-specs/tech-stack.md`.
