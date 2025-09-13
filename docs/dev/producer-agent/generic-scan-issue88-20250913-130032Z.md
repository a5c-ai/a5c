# Generic Producer Scan – Issue #88

## Summary
- Reviewed specs at `docs/specs/README.md` and NE schema.
- Reviewed technical specs under `docs/producer/phases/technical-specs/`.
- Current phase tracked as `Specification Phase`.
- Implementation status:
  - CLI scaffolding present (`src/cli.ts`) with `mentions`, `normalize`, `enrich` commands.
  - Normalization/enrichment currently produce stubbed NE objects; needs provider-aware logic and schema compliance.
  - Mentions extractor implemented with tests; NE schema present.
  - Workflows for build/test/deploy exist.

## Gaps Identified
1) NE schema compliance (normalize/enrich)
- `normalized.event` should include required fields: `repo`, `actor`, `provenance`.
- Current `normalize`/`enrich` set `type: "unknown"` and omit `repo`, `actor`.
- Acceptance: CLI outputs validate against `docs/specs/ne.schema.json` for samples.

2) GitHub provider normalization
- Missing adapter translating `workflow_run`, `pull_request`, `push`, `issue_comment` to NE fields.
- Acceptance: samples under `tests/fixtures/github/*` pass normalize step with correct NE fields.

3) Enrichment – GitHub details
- Implement repo metadata, PR state, code owners, diffs as per specs.
- We have `enrichGithubEvent.js` with logic; integrate into CLI path and type guards.
- Acceptance: vitest covering PR and push cases green.

4) Validation command / schema check
- Add `events validate` to check JSON against NE schema.
- Acceptance: `events validate samples/*.json` returns 0 for valid; 1 for invalid.

5) Lint config mismatch
- ESLint v9 flat config missing (`.eslintrc.json` present).
- Acceptance: add `eslint.config.js` and make `npm run lint` succeed.

6) Tests activation
- vitest config includes only TS tests; JS tests present — harmonize or migrate to TS.
- Acceptance: ensure all tests run or exclude correctly; add minimal CLI smoke tests.

7) Docs alignment
- README has CLI usage; link CLI mention extraction and schema validation examples.
- Acceptance: README quickstart validates against schema.

## Proposed Issues
- [Producer] Backend – NE schema-compliant normalization for GitHub
- [Producer] Backend – Enrichment integration in CLI and flags
- [Producer] Tooling – Add `events validate` (ajv) and CI step
- [Producer] Tooling – ESLint v9 flat config migration
- [Producer] Testing – Activate vitest suite and smoke tests
- [Producer] Docs – README quickstart: validation and mentions

## Notes
- Primary branch is `a5c/main`; this scan on chore branch targeting it.
- Workflows already use `$GITHUB_OUTPUT` for step outputs.

