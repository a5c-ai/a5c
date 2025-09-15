# 🔭 Observability Discovery for CI/Agents (Issue #306)

## Summary

Determine observability needs for CI and agent workflows to shorten MTTR/MTTD. Document signals, sources, surfacing, and ownership. Open follow-up issues for implementation.

## Signals

- Flaky tests (retries, intermittent fails)
- Long jobs and slow steps (p95)
- Reruns (run_attempt > 1)
- Cache hits/misses (actions/cache)
- Coverage and test stats (Vitest)
- Agent step latency and status (a5c.yml Run A5C)

## Surfacing

- GITHUB_STEP_SUMMARY + JSON artifact (observability.json)
- PR comment on thresholds/alerts
- Optional check-run annotations for hotspots

## Ownership & Routing

- CI/Platform owns workflow health; Agents SIG owns a5c steps
- On failure: label ci-failing; flaky-test issues per test; warnings on prolonged durations

## Tooling

- Composite action to aggregate metrics
- Vitest junit reporter + retries
- Artifact upload for dashboards

## Next Steps

- Implement composite action and wire into workflows
- Add Vitest junit + retries
- Emit cache metrics per job
- Add PR commenter logic in a5c or separate action
- Document ownership in CODEOWNERS
