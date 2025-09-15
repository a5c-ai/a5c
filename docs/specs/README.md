# Events SDK/CLI – Project Specifications

## 1) Problem Statement and Scope

- Teams need a consistent way to parse heterogeneous repository and CI/CD events (GitHub Actions runs, webhooks, external systems) and enrich them with actionable context for agentic workflows (triggering, filtering, routing, decisioning).
- Scope: a JavaScript SDK and CLI to normalize events, enrich with metadata and correlations, and output a standard schema for downstream agents and automations.
- Non‑goals (initial): full-fledged orchestration engine, long-running stateful services, vendor lock-in to a single event provider.

## 2) Personas and Primary Use Cases

- Platform Engineer: define org-wide event normalization and policies; integrate with CI and chatops.
- Developer: run CLI locally to test event transformations; write plugin to support custom tool.
- SRE/Automation Engineer: route failures to agents with enriched diagnostics; correlate deployments to incidents.
- Use cases:
  - Normalize GitHub workflow_run and pull_request events to a unified model.
  - Enrich push/build/test events with repo metadata, code owners, diff stats.
  - Filter and route events to specialized agents (e.g., validator, developer) based on policies.
  - Emit concise artifacts for downstream workflows (JSON/stdout/files).

## 3) Event Sources, Types, and Normalization Model

- Sources: GitHub (Actions, webhooks), other VCS/providers via adapters.
- Core types: repo, ref, commit, workflow_run, job, step, pr, issue, comment, release, deployment, check_run, alert.
- Normalized Event (NE) schema (MVP):
  - id: provider-unique id
  - provider: "github"
  - type: one of core types
  - occurred_at: ISO timestamp
  - repo: { id, name, full_name, private, visibility }
  - ref: { name, type, sha, base?: sha, head?: sha }
  - actor: { id, login, type }
  - payload: provider-native payload (raw)
  - enriched: { metadata: {}, derived: {}, correlations: {} }
  - labels: [string] for routing
  - provenance: { source: action|webhook|cli, workflow: { name, run_id }? }

## 4) Enrichment Taxonomy

- metadata: repo settings, branch protection, topics, languages, default branch, owners.
- derived: diff stats, changed files globs, semantic commit parsing, conventional commit scope; commit logs and PR/push diffs; PR conflict status.
- correlations: link workflow_run -> commit -> PR -> issues; map failures to responsible code owners; associate deployments with releases.
- mentions: extract `@agent`/`@user` mentions across commit messages, PR/issue titles + bodies, issue_comment, and changed files (code comments) with location context.
- scoring: compute risk/impact scores for events (MVP optional).

### 4.1) GitHub Enrichment Details (MVP)

- commits (for push/pr): list last N commits with `{ sha, message, author {login,email}, committer {login}, stats {additions,deletions,total} }` and per-commit `files[]` with `{filename,status,additions,deletions,changes,patch?}`; configurable `max_commits` and `include_patch` (default false).
- diffs: summary for event `{changed_files, additions, deletions}` plus `files[]` above. For large diffs, capture only filenames and stats unless explicitly enabled.
- PR state: `{ number, draft, mergeable_state, has_conflicts: boolean, base, head, labels[], requested_reviewers[], requested_teams[] }`. Populate from GitHub API; `has_conflicts` derived from `mergeable_state in {"dirty","blocked"}`.
- branch protections: if token permits, include key flags (dismiss_stale_reviews, required_approvals, linear_history, required_status_checks present?).
- owners: resolved code owners per changed file and union at PR level.
- mentions: see schema below; sources include commit messages, PR/issue title/body, latest issue_comment (event), and code comments in changed files using language-aware regexes for `@name` inside comments.

### 4.2) Mentions Schema

- mentions[] items have:
  - target: `string` (raw mention, e.g., "@researcher-base-agent")
  - normalized_target: `string` (e.g., "researcher-base-agent")
  - kind: `agent|user|team|unknown`
  - source: `commit_message|pr_title|pr_body|issue_comment|code_comment|file_change`
  - location: `{ file?: string, line?: number, commit_sha?: string, comment_id?: number }`
  - context: `string` short excerpt around the mention (<=140 chars)
  - confidence: `0..1` (parser confidence, esp. for code_comment extraction)

Configuration:

- `mentions.scan.changed_files`: `true|false` (default true) — scan changed files for `@...` in code comments.
- `mentions.scan.commit_messages`: `true|false` (default true)
- `mentions.scan.issue_comments`: `true|false` (default true)
- `mentions.max_file_bytes`: bytes cap per file (default 200KB)
- `mentions.languages`: opt-in list for code-comment scanning; default detects via filename.

Example mention from a code comment:

```
{
  "target": "@developer-agent",
  "normalized_target": "developer-agent",
  "kind": "agent",
  "source": "code_comment",
  "location": { "file": "src/feature.ts", "line": 42 },
  "context": "// @developer-agent please review the edge case handling",
  "confidence": 0.85
}
```

## 5) Configuration

- Env vars: `GITHUB_TOKEN` (or custom `A5C_AGENT_GITHUB_TOKEN`), debug flags, provider-specific tokens.
- Sources: prefer GitHub Actions runtime env and `secrets.*` and `vars.*` as in existing workflows.
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`, `--select paths`, `--filter expr` expr`.
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`.
- CLI flags (planned/not yet implemented): `--select fields`, `--filter expr`.
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`, `--select paths`, `--filter expr` expr`.
- Provider adapters: `providers/github`, stub interfaces for others. Auto-detect when running in Actions.

### 5.1) Environment Variables and Precedence

- GitHub token precedence: the runtime checks `A5C_AGENT_GITHUB_TOKEN` first, then falls back to `GITHUB_TOKEN`.
  - Source of truth: `src/config.ts` uses `process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN`.
  - Recommendation: in GitHub Actions, prefer `secrets.A5C_AGENT_GITHUB_TOKEN` (scoped, auditable). Otherwise use `secrets.GITHUB_TOKEN`.
- Debugging: `DEBUG=true` enables verbose logs (redaction still applied).
- Minimal usage examples:

  ```bash
  # Prefer the scoped agent token (takes precedence)
  export A5C_AGENT_GITHUB_TOKEN=ghs_xxx

  # Or rely on the Actions token if agent token is not set
  export GITHUB_TOKEN=ghs_yyy
  ```

- Note: Avoid setting both unless you intend the agent token to override the default token.

### 5.2) Redaction and Safety

- Redaction is applied to logs and structured outputs to prevent leaking secrets.
  - Key-based masking: object properties whose names include sensitive substrings (e.g., `token`, `secret`, `password`, `authorization`) are masked with `REDACTED`.
  - Pattern masking: common secret formats are detected and masked (GitHub PATs `gh[pouse]_...`, JWTs, `Bearer ...`, AWS keys, Stripe, Slack, URL basic auth, etc.).
  - Implementation details in `src/utils/redact.ts`; `DEFAULT_MASK` is `REDACTED`.
- Helper APIs: `redactString(str)`, `redactObject(obj)`, `redactEnv(process.env)`, and `buildRedactor(...)` for customization.
- Best practices:
  - Pass tokens via secrets (e.g., GitHub Actions `secrets.*`), not plain env echoed in scripts.
  - When debugging, log `redactEnv()` output rather than raw `process.env`.

## 6) Extensibility Model

- Plugins: Node-based plugins with lifecycle hooks: `preNormalize`, `postNormalize`, `enrich`, `classify`, `route`.
- Hooks: event pipeline stages; synchronous and async.
- MCP/Tool adapters: expose normalized events to external agents via MCP or simple HTTP.
- Registry: local plugin discovery via `events.plugins.*` in `package.json` or `.eventsrc.*`.

### 6.1) Rule Engine and Composed Events

- Purpose: derive higher-level signals from a single normalized/enriched event without external services.
- Model: lightweight, declarative rules (YAML/JSON) that evaluate predicates over the normalized event and emit a new, composed event.
- Composed Event envelope:
  - `key: string` (machine-friendly identifier)
  - `reason?: string` (optional human-readable summary of matched criteria)
  - `labels?: string[]` additional routing labels
  - `targets?: string[]` optional list of intended agent recipients (by name)
  - `payload?: any` projected fields from the source event

Schema: `docs/specs/ne.schema.json` includes an optional top-level `composed[]` array matching the structure above (each item requires `key`).

Example rule (YAML):

```
name: conflict_in_pr_with_low_priority_label
on: pull_request
when:
  all:
    - $.enriched.github.pr.has_conflicts == true
    - contains($.payload.pull_request.labels[*].name, 'low priority') ||
      contains($.payload.pull_request.labels[*].name, 'priority:low')
emit:
  key: conflict_in_pr_with_low_priority_label
  labels: [conflict, pr, priority:low]
  targets: [developer-agent, triager-agent]
  payload:
    pr_number: $.payload.pull_request.number
    repo: $.repo.full_name
    mergeable_state: $.enriched.github.pr.mergeable_state
```

Minimal output example (excerpt):

```
{
  "id": "123",
  "provider": "github",
  "type": "pull_request",
  "occurred_at": "2025-09-14T22:00:00Z",
  "repo": { "id": 1, "name": "events", "full_name": "a5c-ai/events" },
  "actor": { "id": 2, "login": "octocat", "type": "User" },
  "payload": { /* ... */ },
  "provenance": { "source": "cli" },
  "composed": [
    {
      "key": "conflict_in_pr_with_low_priority_label",
      "reason": "enriched.github.pr.has_conflicts && labels contains priority:low",
      "targets": ["developer-agent"],
      "labels": ["conflict", "pr", "priority:low"],
      "payload": { "pr_number": 42 }
    }
  ]
}
```

Evaluation:

- Rules run in `classify` or `route` hook after `enrich` completes.
- Emitted events are added alongside the original in outputs (stdout/file) and can be forwarded to downstream steps; if `targets` present, router can fan-out per target.

## 7) Security Model

- Secrets: never log secrets; redaction defaults; pass tokens via env only.
- PII: minimal collection; configurable redaction; allowlist of emitted fields.
- Audit: include `provenance` with run ids, actor, and hash of raw payload; optional signed artifacts.
- Permissions: least-privilege tokens; document scopes required for GitHub (`repo:read`, `actions:read`).
- Diffs: patch bodies can contain secrets; `include_patch` defaults to false. Enable explicitly with `--flag include_patch=true` when needed. This reduces payload size and lowers risk of leaking secrets embedded in diffs. Redaction still applies to known patterns and sensitive keys, and size caps are respected.
