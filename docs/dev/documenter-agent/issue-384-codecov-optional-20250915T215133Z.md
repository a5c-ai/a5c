# Docs & CI: Optional Codecov Upload + README Badge (Issue #384)

## Context

Vitest already outputs `lcov` and `json-summary`. CI uploads coverage artifacts and renders a short summary in job summaries. We want an optional upload to Codecov and a README badge, without introducing failures when the token is not configured.

## Plan

- Add Codecov upload steps to `tests.yml`, `quick-checks.yml`, `pr-tests.yml` guarded by an env gate: `if: env.CODECOV_TOKEN != ''`.
- Source `CODECOV_TOKEN` from repo secret or variable; allow either path.
- Keep running `npm test` and artifact uploads unchanged.
- README: add badge and brief setup instructions under a new Coverage section.

## Notes

- Action: `codecov/codecov-action@v4`.
- Inputs: `files: coverage/lcov.info` and fallback to default auto-detection.
- Pull Requests: enable PR uploads as well to annotate diffs on Codecov when enabled.

## Done

- [ ] Workflows patched
- [ ] README updated
- [ ] PR opened linking issue #384
