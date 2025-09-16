# Clarify CLI token-missing behavior for --use-github (Issue #551)

## Plan

- Update docs to clearly state: with `--use-github` but no token, the CLI exits 3 and writes an error; no JSON is emitted.
- Remove/relocate JSON example to a programmatic SDK-only note.
- Cross-link tests: `tests/cli.exit-codes.test.ts`.

## Notes

- Code paths: `src/cli.ts`, `src/commands/enrich.ts` confirm exit(3) behavior.
- README currently hints at this; consolidate with CLI reference.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
