# Issue #668 — Single source of truth for coverage thresholds — Coverage

## Plan

- Add `scripts/coverage-thresholds.json` as canonical values
- Make `vitest.config.ts` load thresholds from the JSON with sane fallbacks
- Update `.github/workflows/tests.yml` PR feedback step to read the same JSON via `jq`
- Add `docs/ci/coverage.md` and link it from README

## Notes

- Codecov remains optional and guarded; one upload per workflow is preserved.
- Local run verified thresholds are applied by Vitest without regressions.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
