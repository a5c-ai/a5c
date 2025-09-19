# On-call Runbook

This lightweight runbook standardizes incident triage for this repository. It defines severity levels, ownership, labels, and a pragmatic response flow centered on GitHub Issues/PRs and Actions.

- Audience: first responders, maintainers, and CI/platform owners
- Scope: this repo’s CI, tests, release automation, and SDK/CLI health
- Related docs: see `docs/observability.md` for artifacts and signals

## Severity Levels (S1–S4)

Use the `incident` label plus one `sev:Sx` label. Pick the highest applicable severity.

- sev:S1 — Critical outage
  - Impact: broken default branch (`a5c/main`) pipelines, production release blockage, security incident with active exposure
  - Examples: tests fail on `a5c/main` for all PRs; release job blocked; leaked secret detected with exploitation risk
  - Response: immediate; responders drop current work; form incident thread
- sev:S2 — Major degradation
  - Impact: frequent CI failures or flaky tests blocking merges, non-exploited high-risk vulnerability, broken preview paths
  - Examples: flaky detector flags widespread flakiness; coverage gate misconfigured causing false failures
  - Response: same day; prioritize until unblocked
- sev:S3 — Moderate issue
  - Impact: localized failures, intermittent warnings, toolchain regressions with workarounds
  - Examples: a matrix job fails on Node x.y only; docs link linter failing sporadically
  - Response: this week; schedule and fix
- sev:S4 — Minor issue / follow-up
  - Impact: no immediate risk; improvement or clean-up
  - Examples: better summaries, optimization, doc gaps
  - Response: best effort; track and batch

## Labels for Triage

Apply labels consistently so automations and dashboards stay useful.

- incident — denotes active or postmortem incident threads
- sev:S1 | sev:S2 | sev:S3 | sev:S4 — severity as defined above
- area:ci — CI workflows (e.g., `.github/workflows/tests.yml`, `quick-checks.yml`, `a5c.yml`)
- area:tests — unit/integration tests and coverage feedback

Tip: on PRs, the tests workflow may add `coverage:ok` or `coverage:low`; treat systematic `coverage:low` on `a5c/main` as at least S3 until root-caused.

## Ownership & Escalation

- Primary Owners
  - Platform/CI: `@a5c-ai/platform`
  - Docs: `@a5c-ai/docs`
  - Default fallback: `@a5c-ai/maintainers`
- Codeowners
  - `docs/oncall.md` is owned by Platform and Docs to keep response guidance current.
- Escalation Path
  1. Assign the issue to yourself and add `incident` + `sev:Sx` + `area:*`
  2. If no response within the target time for the severity, escalate to `@a5c-ai/platform`
  3. For security-sensitive issues, escalate to repo admins and rotate credentials as needed

## Response Expectations

- S1
  - Acknowledge within 15 minutes; update every 30 minutes
  - Create or link a tracking issue titled `[INCIDENT] <short summary>` and pin it during the incident
  - Freeze merges to `a5c/main` unrelated to the fix; consider temporary rollbacks
- S2
  - Acknowledge within 2 hours; update daily until resolved
  - Consider temporary workflow guards (e.g., warn-only) if helpful
- S3
  - Acknowledge within 1 business day; include remedial plan
- S4
  - Track as normal work; batch fixes where possible

## Where to Watch (Monitoring & Alerts)

- GitHub Actions
  - `tests.yml` — vitest matrix, coverage artifact; posts `coverage:ok|low` labels on PRs
  - `quick-checks.yml` — fast lints and link checks
  - `a5c.yml` — orchestrates agent runs on `workflow_run`, `issue_comment`, `issues`; uploads `a5c-artifacts`
  - `codeql.yml` — code scanning results (see Security tab)
- Observability Artifacts
  - `observability.json` attached as workflow artifact; see `docs/observability.md`
  - Aggregates and step summaries help correlate failures and durations

## How to Acknowledge

- On Issues/PRs: comment “Acknowledged” with intended severity and first steps; self-assign and add labels
- On Workflow Failures: click a failed Action run, review logs and artifacts, link the run URL in the incident issue
- Optional External Paging: if your team uses chat/on-call paging, link the procedure here

## First Responder Checklist

- [ ] Add `incident` + `sev:Sx` + `area:*` labels
- [ ] Create or update an incident issue; add reproduction and links to runs
- [ ] Triage scope: CI, tests, code scanning, release, docs
- [ ] Mitigate user impact first; then root cause and permanent fix
- [ ] Capture notes; close with resolution summary and follow-ups

## Post-incident

- Write a brief resolution in the issue; include root cause, fix, and prevention
- Add follow-up tasks with owners and due dates (e.g., deflake tests, add guards)

---

Maintainers: update this runbook as workflows or ownership change.
