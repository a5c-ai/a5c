# GitHub Adapter → Normalized Event (NE)

This page describes how GitHub payloads map to the Normalized Event (NE) schema. It covers `workflow_run`, `pull_request`, `push`, and `issue_comment`.

See NE schema: `docs/specs/ne.schema.json`

## Common Fields

- id: GitHub event identifier — prefer the primary object id (e.g., `workflow_run.id`, `pull_request.id`, `push.after` sha as id surrogate, `comment.id`).
- provider: `"github"`.
- type: `workflow_run | pull_request | push | issue_comment` per event.
- occurred_at: timestamp from payload (`workflow_run.created_at/completed_at`, `pull_request.created_at`, `repository.pushed_at` or head commit timestamp for `push`, `comment.created_at`).
- repo: from `repository { id, name, full_name, private, visibility }`.
- ref: depends on event type (branch/tag and SHAs).
- actor: prefer the `sender` block with `{ id, login, type }`.
- payload: the full raw payload (retain as-is for traceability and validation).
- provenance: detect if running in GitHub Actions vs. webhook vs. local CLI.

## Mapping by Event Type

### workflow_run

- id: `workflow_run.id`
- occurred_at: `workflow_run.created_at` (or `updated_at/completed_at` depending on triggers)
- repo: from root `repository` block
- ref:
  - name: `workflow_run.head_branch`
  - type: `branch`
  - sha: `workflow_run.head_sha`
- actor: from `sender`
- provenance.workflow: `{ name: workflow_run.name, run_id: workflow_run.id }`
- labels: include `status:<status>` and `conclusion:<conclusion>` if present

### pull_request

- id: `pull_request.id`
- occurred_at: `pull_request.created_at` (or event-specific `synchronize/closed` use `updated_at`)
- repo: `repository`
- ref:
  - base: `pull_request.base.sha`
  - head: `pull_request.head.sha`
  - name: `pull_request.head.ref`
  - type: `branch`
- actor: `sender`
- labels: from `pull_request.labels[].name`

### push

- id: prefer `after` (sha); fallback to `head_commit.id`
- occurred_at: `head_commit.timestamp` (or latest commit timestamp)
- repo: `repository`
- ref:
  - name: `ref` (e.g., `refs/heads/main` → normalize to `main`)
  - type: `branch` if `refs/heads/*`, `tag` if `refs/tags/*`
  - sha: `after`
- actor: `sender`
- labels: include `pushed_by:<actor.login>` optionally

### issue_comment

- id: `comment.id`
- occurred_at: `comment.created_at`
- repo: `repository`
- ref: typically absent; may populate from linked issue/PR if provided
- actor: `comment.user`
- labels: include `issue:<issue.number>` and if the comment is on a PR, `pr:<pull_request.number>`

## Provenance Detection (Actions)

When running under GitHub Actions, detect:

- provenance.source: `action`
- provenance.workflow.name: `$GITHUB_WORKFLOW`
- provenance.workflow.run_id: `$GITHUB_RUN_ID`

CLI and webhooks should set `source` to `cli` and `webhook` respectively.

## Redaction

- Do not include secrets from env in `payload`.
- If logs show env, redact `*_TOKEN`, `*_SECRET`.

## Validation

Validate produced NE against `docs/specs/ne.schema.json`.
