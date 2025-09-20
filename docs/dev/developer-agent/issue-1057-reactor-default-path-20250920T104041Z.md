# Clarify reactor default path — Reactor (issue #1057)

## Context

Implementation defaults to directory `.a5c/events/` (recursive YAML load) while CLI help/docs mention single file `.a5c/events/reactor.yaml`.

## Plan

- Update `src/cli.ts` `--file` help to: "reactor rules path (file or directory), default .a5c/events/".
- Update docs:
  - `README.md` (Reactor Quick Start) — state default dir `.a5c/events/` and that single-file `.a5c/events/reactor.yaml` is supported.
  - `docs/ci/actions-e2e-example.md` — prefer default and show optional `--file`.
  - `docs/cli/reference.md#events-reactor` — document directory default and recursive `*.yml|*.yaml`.
- Build, run tests, and open PR.

## Notes

Behavior remains unchanged; only descriptions align with `resolveRulesPath()` and loader.
