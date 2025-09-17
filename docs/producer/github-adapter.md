# GitHub Adapter → Normalized Event (NE)

This page describes how GitHub payloads map to the Normalized Event (NE) schema. It covers `workflow_run`, `pull_request`, `push`, and `issue_comment`. Additional normalized types supported: `release`, `deployment`, `job` (from `workflow_job`), `step` (when granular step context is provided), and `alert` (e.g., `code_scanning_alert`, `secret_scanning_alert`).

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

### release

- id: `release.id` (fallback: `release.tag_name`)
- occurred_at: `release.published_at` (fallback: `release.created_at`)
- ref:
  - name: `release.tag_name`
  - type: `tag`
  - sha: include when `release.target_commitish` is a 40-hex sha

### deployment / deployment_status → deployment

- id: `deployment.id` (for `deployment_status`, use `deployment.id` from nested object)
- occurred_at: `deployment_status.created_at` (fallback: `deployment.created_at`)
- ref:
  - name: `deployment.ref` (plain branch or tag name)
  - type: `branch` (heuristic default)

### workflow_job → job

- id: `workflow_job.id`
- occurred_at: `workflow_job.completed_at | started_at | created_at`
- ref:
  - name: `workflow_job.head_branch`
  - type: `branch`
  - sha: `workflow_job.head_sha`

### step

- When a granular step-level payload exists (non-standard; e.g., composed or custom emit), map to type `step`.
- id: `step.id` (fallback: derive from `step.name`)
- occurred_at: `step.completed_at | step.started_at | step.created_at`
- ref: derived from surrounding `workflow_job` when present

### alert (code/secret scanning)

- id: `alert.number` (fallback: `alert.id`)
- occurred_at: `alert.updated_at | alert.created_at`
- ref: typically absent

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
