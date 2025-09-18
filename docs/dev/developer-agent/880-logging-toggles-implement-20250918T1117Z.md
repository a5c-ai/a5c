# Issue #880 — Implement logging toggles in CLI (Option A)

Start: 2025-09-18T11:17:00Z

## Context

- Observability docs propose `A5C_LOG_FORMAT` and `--log-format/--log-level` flags.
- Code partially honors `A5C_LOG_LEVEL` in `emit` and `reactor`; no global flags yet.

## Plan

- Add zero-deps logger shim `src/log.ts` (json/pretty, levels, scope).
- Add global CLI flags `--log-level` and `--log-format` mapped to env vars.
- Wire `reactor` and `emit` to the shared logger.
- Update docs: `docs/observability.md`, `docs/cli/reference.md` (Global flags), `docs/user/sdk-quickstart.md`.
- Add smoke tests: help shows flags; logger JSON line format test.

## Notes

- Keep changes minimal and backward compatible.
- Default format: `pretty`; recommend `json` in CI.

## Next
