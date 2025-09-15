# 🔭 Observability Discovery for CI/Agents (Issue #306)

## Summary
Goal: reduce MTTR/MTTD in CI and agent workflows by adding actionable visibility: key signals, surfacing, and ownership.

## Current Signals & Opportunities
- CI Workflows: Build, Tests, Lint, Packages Npx Test, Deploy (via workflow_run fan-in)
- Agent Workflow: .github/workflows/a5c.yml (Run A5C step)
- Repo stack: TypeScript, Vitest, ESLint, semantic-release

Gaps observed:
- No unified per-run summary across jobs (durations, failures, retries)
- No flaky test tracking over time
- No standardized artifacts for dashboards (JSON/CSV)
- Cache hit rates not surfaced
- Ownership/on-failure routing not documented

## Proposed Key Signals
- Job duration: total and per-step max
- Queue/wait vs execution time (approx via started_at/completed_at)
- Test stats: pass/fail count, slowest tests, retries (flaky)
- Reruns: workflow run_attempt > 1; PR requeues
- Cache: actions/cache hit ratio per key
- Agent step latency: a5c action duration, success/failure

## Surfacing Methods (MVP → Optional)
- MVP: GITHUB_STEP_SUMMARY + uploaded JSON artifact (observability.json)
- MVP: PR comment summary on failures or threshold breaches
- Optional: Check-run annotations for top failing tests/slow steps
- Optional: Lightweight dashboard consuming artifact (later)

## Tooling Choices
- Collection: GitHub Actions composite action to aggregate from job context and tool outputs
- Tests: Vitest with junit reporter + retries to infer flakiness
- Artifacts: JSON (machine) + Markdown (human) uploaded per run

## Ownership & On-Failure Routing (Proposal)
- Ownership: CI/Platform owners (TBD in CODEOWNERS or team) own workflow health; SIG “Agents” own a5c steps
- On failure thresholds:
  - Any job failure: PR comment + label ci-failing
  - Flaky tests detected: open/update issue per test with label flaky-test
  - Prolonged durations (> p95 per job): PR warning comment

## Implementation Plan (follow-up issues)
1) Composite action: Collect metrics and write summary + JSON
2) Vitest: Add junit reporter, enable retries, export timings
3) Cache: Emit cache-hit metrics and include in summary
4) PR commenter: Post summaries/alerts on thresholds
5) Ownership: Introduce CODEOWNERS and labels; doc routing

## Acceptance Mapping
- Discovery doc: this file
- Alerting paths: Ownership & On-Failure Routing section
- Follow-up issues: created and linked as sub-issues to #306

## Notes
- Start minimal, iterate safely; keep PR checks fast.

