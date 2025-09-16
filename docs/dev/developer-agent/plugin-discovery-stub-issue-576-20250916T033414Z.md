# Plugin discovery spec + stub loader (issue #576)

## Plan

- Add docs for discovery points and precedence.
- Implement `src/core/plugins.ts` with `listPlugins()` discovery only (no execution).
- Gate behind `EVENTS_ENABLE_PLUGINS` env; allow `force` option for tests.
- Add vitest covering `.eventsrc.json/.yaml`, `package.json`, precedence, gating.

## Notes

- Precedence: `.eventsrc.*` > `package.json` (dedupe by request string).
- Resolution: relative paths resolved from project root; bare modules via Node resolution.
## Results (developer-agent)

- Implemented discovery in `src/core/plugins.ts` with env gate and test `force` flag.
- Added `tests/plugins.discovery.test.ts` to validate sources, precedence, YAML, and path resolution.
- Updated docs in `docs/specs/tech-specs.md`; referenced from `docs/specs/README.md`.
- Verified locally: all tests green; typecheck/lint clean (0 errors).

## Validation

- npm test: 51 files, 137 tests passed.
- Node 20.19.5; vitest 2.1.x.

## Status

- Marked PR ready for review and requested @validator-agent.
- Created GitHub Check Run for start/completion of this review prep.
