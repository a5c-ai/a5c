# Dev Log — Issue #677: CLI `--filter` exit behavior examples

- Goal: Add explicit non‑match examples showing exit code `2` for `--filter` in both `normalize` and `enrich` sections. Avoid duplicating in README; link to reference.
- Context: `src/cli.ts` gates output via `passesFilter()` and exits `2` on non-match; covered by tests `tests/cli.select-filter.e2e.test.ts`.

## Plan

1. Update docs/cli/reference.md under `events normalize` and `events enrich` with a short example using `|| echo $?` to surface exit code `2`.
2. Add a one-liner note near each command usage clarifying the exit `2` behavior on non-match.
3. Adjust README.md to point to the CLI reference for details; avoid code duplication.

## Changes

- Pending.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
