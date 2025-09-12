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
- `mentions.scan.changed_files`: `true|false` (default true)
- `mentions.scan.commit_messages`: `true|false` (default true)
- `mentions.scan.issue_comments`: `true|false` (default true)
- `mentions.max_file_bytes`: bytes cap per file (default 200KB)
- `mentions.languages`: opt-in list for code-comment scanning; default detects via filename.

## 5) Configuration
- Env vars: `GITHUB_TOKEN` (or custom `A5C_AGENT_GITHUB_TOKEN`), debug flags, provider-specific tokens.
- Sources: prefer GitHub Actions runtime env and `secrets.*` and `vars.*` as in existing workflows.
- CLI flags: `--in file.json` (webhook sample), `--out out.json`, `--select fields`, `--filter expr`, `--label key=value`.
- Provider adapters: `providers/github`, stub interfaces for others. Auto-detect when running in Actions.

## 6) Extensibility Model
- Plugins: Node-based plugins with lifecycle hooks: `preNormalize`, `postNormalize`, `enrich`, `classify`, `route`.
- Hooks: event pipeline stages; synchronous and async.
- MCP/Tool adapters: expose normalized events to external agents via MCP or simple HTTP.
- Registry: local plugin discovery via `events.plugins.*` in `package.json` or `.eventsrc.*`.

### 6.1) Rule Engine and Composed Events
- Purpose: derive higher-level signals from a single normalized/enriched event without external services.
- Model: lightweight, declarative rules (YAML/JSON) that evaluate predicates over the normalized event and emit a new, composed event.
- Composed Event envelope:
  - `type: "composed"`, `key: string` (machine-friendly identifier)
  - `source_event_id`: id of the originating event
  - `labels`: additional routing labels
  - `targets`: optional list of intended agent recipients (by name)
  - `payload`: projected fields from the source event

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

Evaluation:
- Rules run in `classify` or `route` hook after `enrich` completes.
- Emitted events are added alongside the original in outputs (stdout/file) and can be forwarded to downstream steps; if `targets` present, router can fan-out per target.

## 7) Security Model
- Secrets: never log secrets; redaction defaults; pass tokens via env only.
- PII: minimal collection; configurable redaction; allowlist of emitted fields.
- Audit: include `provenance` with run ids, actor, and hash of raw payload; optional signed artifacts.
- Permissions: least-privilege tokens; document scopes required for GitHub (`repo:read`, `actions:read`).
 - Diffs: patch bodies can contain secrets; `include_patch` defaults to false; redact known patterns; respect size caps.
 - Mentions: do not process binary files; skip files exceeding `mentions.max_file_bytes`.

## 8) Performance Targets and Constraints
- CLI target: <200ms for simple payloads; <2s for large workflow_run payloads.
- Memory: <128MB typical; stream large payloads.
- Throughput: able to handle 100 events/min in CI job sequentially.
- Artifacts: <512KB per normalized JSON by default; allow compression.
 - Mentions scan: limit to <=500 changed files and <=1e6 total bytes; short-circuit when caps reached; include counters in `enriched.derived.scan_limits`.

## 9) Acceptance Tests (BDD Outline)
- Feature: Normalize GitHub workflow_run event
  - Scenario: Successful normalization
    - Given a sample `workflow_run.completed` payload
    - When I run `events normalize --in payload.json`
    - Then output contains `type: workflow_run` and `repo.full_name`
    - And `provenance.workflow.name == "Build"`
- Feature: Enrich PR event with code owners
  - Scenario: Owners resolved
    - Given a sample `pull_request.opened` payload and a CODEOWNERS file
    - When I run `events enrich --in pr.json`
    - Then `enriched.metadata.owners` includes team handles
- Feature: Redaction
  - Scenario: Secrets removed
    - Given payload with tokens in env
    - Then output has redacted values and no secrets in logs

- Feature: PR conflict detection
  - Scenario: Merge conflicts present
    - Given a sample `pull_request.synchronize` payload for a conflicted PR
    - When I run `events enrich --in pr.json`
    - Then `enriched.github.pr.has_conflicts == true`
    - And `enriched.github.pr.mergeable_state in ["dirty","blocked"]`

- Feature: Commit logs and diffs
  - Scenario: Push with multiple commits
    - Given a sample `push` payload with 3 commits
    - When I run `events enrich --in push.json --flag include_patch=false`
    - Then `enriched.commits | length == 3`
    - And `enriched.diff.changed_files > 0`

- Feature: Mention extraction
  - Scenario: Mentions in commit message and PR body
    - Given a commit message containing `@researcher-base-agent` and a PR body mentioning `@developer-agent`
    - When I run `events enrich --in pr.json`
    - Then `enriched.mentions[*].normalized_target` contains `researcher-base-agent` and `developer-agent`
    - And each mention has `source` populated and `context` excerpt

- Feature: Composed event emission
  - Scenario: Conflict + low priority label
    - Given a conflicted PR labeled `priority:low`
    - When rules include `conflict_in_pr_with_low_priority_label`
    - Then output includes a composed event with `key: conflict_in_pr_with_low_priority_label`
    - And it carries `targets` including `developer-agent`

## 10) Out of Scope and Phased Roadmap
- Out of scope (MVP): multi-tenant service, UI dashboards, persistent DB.
- Phase 1 (MVP): GitHub adapter, CLI normalize + enrich, plugin hooks, redaction, JSON output, examples.
- Phase 2: Routing policies, risk scoring, basic correlations across runs/PRs.
- Phase 3: Additional providers (GitLab/Bitbucket), MCP integrations, artifact signing.

## 11) Cross-References
- Workflows in this repo:
  - `.github/workflows/a5c.yml` (agent router; uses `A5C_AGENT_GITHUB_TOKEN` and `vars.*`)
  - `.github/workflows/main.yml` (Build; Node/Python setup; scripts/build.sh, scripts/test.sh)
  - `.github/workflows/deploy.yml` (Deployment targeting `a5c/main`)
- Seed constraints: see `seed.md` (do not write specs blindly; produce deliberate design; use a5c/main as primary branch).

## 12) Examples
- GitHub Actions example (normalize current run):
  ```yaml
  - name: Normalize workflow_run
    run: |
      npx @a5c/events normalize --source actions --select repo.full_name,type,provenance.workflow.name > event.json
  ```
- Webhook payload example (CLI):
  ```bash
  events normalize --in samples/workflow_run.completed.json --out out.json --label env=staging
  jq '.type, .repo.full_name, .provenance.workflow.name' out.json
  ```

- Enrich PR and emit composed events:
  ```bash
  events enrich --in samples/pull_request.synchronize.json \
    --select type,repo.full_name,enriched.github.pr.mergeable_state \
    --rules rules/conflicts.yml > out.json
  jq '.enriched.github.pr.has_conflicts, (.composed // [])[].key' out.json
  ```

## 13) MVP vs. Stretch
- MVP: GitHub provider, normalization schema above, enrichment: repo metadata + codeowners, redaction, CLI UX, samples + BDD outlines.
- Stretch: correlations across runs/PRs/issues, policy-based routing, MCP bridge, additional providers, signing and audit trail export.
