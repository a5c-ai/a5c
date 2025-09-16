# Issue #77 – CLI smoke + schema conformance tests (normalize/enrich)

## Plan

- Add Vitest for `handleNormalize` using samples under `samples/`
- Add Vitest for `handleEnrich` verifying `enriched.metadata` and `enriched.derived.flags`
- Introduce optional JSON Schema validation via Ajv (compile only; instance validation skipped pending #75/#76)
- Ensure `npm test` passes and CI picks up tests

## Notes

- Depends on #75 and #76 for full schema conformance. Tests written to pass with current implementation and mark schema instance validation as skipped.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)

## Results

- Added tests: tests/normalize.basic.test.ts, tests/enrich.basic.test.ts, tests/ne.schema.compile.test.ts
- Installed dev deps: ajv, ajv-formats
- All tests pass locally via `npm test`
- Opened draft PR #84 against `a5c/main`
