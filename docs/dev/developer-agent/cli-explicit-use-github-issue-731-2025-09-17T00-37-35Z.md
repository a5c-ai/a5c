# Clarify default GitHub enrichment behavior — explicit `--use-github`

## Context

Issue: https://github.com/a5c-ai/events/issues/731
Docs state offline-by-default; current CLI auto-enables GitHub enrichment when a token exists.

## Plan

- Require explicit `--use-github` to set `flags.use_github` (no implicit enable by token).
- Add `A5C_EVENTS_AUTO_USE_GITHUB=true` escape hatch (documented) for CI.
- Update README and docs/cli/reference.md to reflect behavior.
- Add tests:
  1. token present + no flag → offline stub (reason: `flag:not_set`).
  2. `--use-github` + missing token → exit 3.
  3. `--use-github` + token → online path (covered by existing tests; ensure CLI path aligns).

## Notes

- Programmatic API (`handleEnrich`) already respects `flags.use_github`; change is in `src/cli.ts` flag wiring.
- Keep offline stub contract with `reason: "flag:not_set"` per tests and docs.
