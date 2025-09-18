# Issue 904 – Observability defaults alignment

## Context

- Issue: #904 – Observability doc conflicts on default CLI log format.
- Code defaults: `pretty` format, `info` level (see `src/log.ts`, `src/cli.ts`).
- Docs impacted: `docs/observability.md` (Structured Logging section).

## Plan

1. Update wording to: default is `pretty` for humans; recommend JSON in CI.
2. Keep CLI Behavior subsection unchanged (already correct).
3. Verify `events --help` and tests reference `--log-format` and `--log-level`.

## Notes

- No code changes; documentation only.
- Cross-check related docs: `docs/cli/reference.md`, SDK quickstart.

## Results

- Updated `docs/observability.md` Structured Logging bullet to: default `pretty` for humans; JSON recommended for CI. No code changes.
- Verified CLI flags and defaults in `src/log.ts` and `src/cli.ts` and tests `test/cli.help.flags.test.ts`.
