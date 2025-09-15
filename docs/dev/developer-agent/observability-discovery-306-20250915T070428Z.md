# 🔭 Observability Discovery for CI/Agents (Issue #306)

## Summary

Determine observability needs for CI and agent workflows to shorten mean-time-to-diagnosis (MTTD) and mean-time-to-recovery (MTTR). This document consolidates current repo capabilities and proposes an actionable MVP and follow-ups.

## Current Capabilities (in repo)

- Composite actions:
  - `.github/actions/obs-summary` — writes step summary and emits `observability.json`; supports cache envs and coverage.
  - `.github/actions/obs-collector` — alternate collector with similar outputs.
- Workflows:
  - `.github/workflows/tests.yml` — uses `obs-summary` with `OBS_FILE: observability.json`, uploads coverage lcov and JUnit, and posts PR coverage feedback with labels (`coverage:ok|low`).
- Docs:
  - `docs/observability.md` — observability for SDK/CLI consumers (library-level guidance).

## Proposed Key Signals

- Flaky tests: retries > 0, intermittent failures; identify test names and files.
- Long jobs/steps: track duration, show p95 slow steps; surface regressions.
- Reruns: `run.attempt > 1` to flag unstable workflows.
- Cache efficiency: per-job cache hit/miss summary.
- Coverage: totals and trend direction (PR vs base), thresholds gate.
- Agent steps: a5c workflow step durations and status.

## Surfacing Methods

- Step summary (`GITHUB_STEP_SUMMARY`) for human scan in run.
- JSON artifact (`observability.json`) for machine use and dashboards.
- PR comments with thresholds/labels for quick feedback loops.
- Optional check-run annotations for hotspots (future enhancement).

## Ownership & Routing

- CI/Platform: owns workflows health; triages `ci-failing` label.
- Agents SIG: owns `a5c.yml` and agent-specific steps; triages `agents` issues.
- On failure routing:
  - Add `ci-failing` when any required job fails.
  - Add `flaky-test` and open issue per test if retries observed (follow-up automation).

## MVP Implementation Plan

1. Standardize `observability.json` schema v0.1 and add example under `docs/examples/`.
2. Ensure `.github/workflows/tests.yml` always uploads observability artifact (already true) and step summary shows coverage/cache.
3. Add documentation snippet in README linking the composite action and example artifact.
4. Prepare follow-up automation issues: flaky detection, long-step threshold annotations, cache reporting expansions.

## Acceptance Criteria Mapping

- Discovery doc with chosen signals, sources, tooling — THIS DOCUMENT + references.
- Alerting/notification paths documented — On-failure labeling and ownership above.
- Follow-up implementation issues opened — see list below.

## Follow-up Issues (to open)

- Flaky test detector: parse JUnit, map retries, open/label issues per test.
- Long step hotspot annotator: parse job logs/timings, add check-run annotations.
- Cache metrics enrichment: include primary keys and hit ratio across matrix.
- Schema stability: promote `schema_version` in artifact and docs.
- Dashboard wiring: publish artifact to a data sink or GH Insights.

## Notes

- Keep runtime overhead minimal; rely on Actions data and artifacts.
- Prefer additive JSON fields for forward compatibility.

By: developer-agent
