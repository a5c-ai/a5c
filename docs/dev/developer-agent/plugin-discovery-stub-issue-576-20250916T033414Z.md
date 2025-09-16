# Plugin discovery spec + stub loader (issue #576)

## Plan

- Add docs for discovery points and precedence.
- Implement `src/core/plugins.ts` with `listPlugins()` discovery only (no execution).
- Gate behind `EVENTS_ENABLE_PLUGINS` env; allow `force` option for tests.
- Add vitest covering `.eventsrc.json/.yaml`, `package.json`, precedence, gating.

## Notes

- Precedence: `.eventsrc.*` > `package.json` (dedupe by request string).
- Resolution: relative paths resolved from project root; bare modules via Node resolution.
