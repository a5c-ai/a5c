---
title: CLI Reference
description: Commands, flags, and examples for the Events CLI (`mentions`, `normalize`, `enrich`, `reactor`, `emit`, `validate`).
---

# CLI Reference

The CLI transforms provider payloads into a Normalized Event (NE), extracts mentions, can enrich with repository context, and can apply a reactor to generate custom events. Implemented with `commander` (see `src/cli.ts`).

## Commands

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
- `--out FILE`: write result JSON (stdout if omitted)
- `--rules FILE`: YAML/JSON rules file (optional). When provided, matching rules emit `composed[]` with `{ key, reason, targets?, labels?, payload? }`.
  - `--flag KEY=VAL...`: enrichment flags (repeatable); notable flags:
    - `include_patch=true|false` (default: `false`) – include diff patches; when `false`, patches are removed. Defaulting to false avoids leaking secrets via diffs and keeps outputs small; enable only when required.
    - `commit_limit=<n>` (default: `50`) – limit commits fetched for PR/push
    - `file_limit=<n>` (default: `200`) – limit files per compare list
  - Mentions scanning flags:
    - `mentions.scan.changed_files=true|false` (default: `true`) – enable/disable scanning code comments in changed files for `@mentions`
    - `mentions.scan.commit_messages=true|false` (default: `true`) – enable/disable scanning commit messages for `@mentions`
    - `mentions.scan.issue_comments=true|false` (default: `true`) – enable/disable scanning issue comment bodies for `@mentions`
    - `mentions.max_file_bytes=<bytes>` (default: `204800` ≈ 200KB) – skip files larger than this when scanning
    - `mentions.languages=<values,...>` – optional allowlist of languages to scan. Accepted values are canonical language IDs and common extensions (with or without a leading dot); values are normalized to IDs. Canonical IDs: `js, ts, py, go, java, c, cpp, sh, yaml, md`.
      - Mapping note: common extensions normalize to IDs before comparison (e.g., `.tsx → ts`, `.jsx → js`, `.yml → yaml`).
  - `--use-github`: enable GitHub API enrichment; equivalent to `--flag use_github=true` (requires `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`). Without this flag, the CLI performs no network calls and sets `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }` (canonical and stable). See Behavior above for semantics and exit codes.
  - Escape hatch for CI convenience: set environment variable `A5C_EVENTS_AUTO_USE_GITHUB=true` to auto-enable GitHub enrichment when a token is present (still no effect if no token). Default remains offline unless `--use-github` is explicitly provided.
  - Notes: Mentions found in file diffs or changed files are emitted with `source: code_comment` and include `location.file` and `location.line` when available.
- `--label KEY=VAL...`: labels to attach
- `--select PATHS`: comma-separated dot paths to include in output
- `--filter EXPR`: filter expression `path[=value]`; if it doesn't pass, exits with code `2`

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

Emit a JSON event to a sink (`stdout`, `file`, or `github`). The payload is redacted before being written or dispatched.

Usage:

```bash
events emit [--in FILE] [--sink <stdout|file|github>] [--out FILE]
```

- `--in FILE`: input JSON file (reads from stdin if omitted)
- `--sink <name>`: sink name; `stdout` (default), `file`, or `github`
- `--out FILE`: output file path (required when `--sink file`)

Behavior:

- Redaction: payload is masked using the same rules as other commands (see `src/utils/redact.ts`). Sensitive keys and common secret patterns are redacted before emission.
- Defaults: when `--sink` is omitted, `stdout` is used. When `--sink file` is set, `--out` is required; otherwise the command exits with code `1` and writes an error to stderr.
- Auto-sink: if `--out` is provided without `--sink`, the sink is treated as `file`.

GitHub sink

Dispatches a `repository_dispatch` event to the repository in `GITHUB_REPOSITORY`.

- Required env:
  - `GITHUB_TOKEN` (or `A5C_AGENT_GITHUB_TOKEN`) — token with `repo` scope that can call the Repository Dispatch API.
  - `GITHUB_REPOSITORY` — target repository in `owner/repo` form.
- Event mapping (per `src/emit.ts`):
  - `event_type` is taken from `event.event_type || event.type || "custom"`.
  - `client_payload` is taken from `event.client_payload || event.payload || event`.
  - If the input is `{ events: [...] }`, each item is dispatched; otherwise, the single input object is dispatched once.
- Redaction applies before dispatch. Ensure secrets aren't included; redaction masks common keys but cannot guarantee all sensitive data is removed.
- Rate limits and permissions apply. The token must have permission on the target repo. Dispatches are best-effort; failures exit with code `1` and print an error.

Examples:

```bash
# From file to stdout (default)
events emit --in samples/push.json

# From stdin to stdout
cat samples/push.json | events emit

# Pipe from normalize
events normalize --in samples/push.json | events emit

# To a file sink (explicit)
events emit --in samples/push.json --sink file --out out.json

# To a file sink (implicit via --out)
events emit --in samples/push.json --out out.json

# Enrich then emit to artifact file
events enrich --in samples/pr.json --out enriched.json \
  && events emit --in enriched.json --sink file --out artifact.json

# Dispatch to GitHub (repository_dispatch)
export GITHUB_TOKEN=ghp_...                 # or A5C_AGENT_GITHUB_TOKEN
export GITHUB_REPOSITORY=a5c-ai/events      # owner/repo

# Minimal event (type inferred → "custom")
events emit --in samples/push.json --sink github

# Explicit event_type and client_payload
cat > /tmp/dispatch.json << 'JSON'
{ "event_type": "ci:notify", "client_payload": { "status": "ok", "run_id": 123 } }
JSON
events emit --in /tmp/dispatch.json --sink github

# Batch dispatch (array under `events[]`)
cat > /tmp/batch.json << 'JSON'
{ "events": [
  { "type": "ci:notify", "payload": { "status": "ok" } },
  { "type": "ci:notify", "payload": { "status": "failed", "reason": "lint" } }
]}
JSON
events emit --in /tmp/batch.json --sink github
```

Exit codes:

- `0`: success
- `1`: error (I/O, JSON parse, missing `--out` for file sink, or GitHub dispatch failure/missing env)

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
