# Issue 193 – Provider abstraction and commands structure

## Plan

- Move CLI command handlers into `src/commands/normalize.ts` and `src/commands/enrich.ts`.
- Keep exports and CLI arguments stable.
- Keep provider logic in `src/providers/github/` and update imports accordingly.
- Build and run tests to verify.

## Notes

- Existing `src/normalize.ts` and `src/enrich.ts` contain handlers used by `src/cli.ts`.
- `src/enrichGithubEvent.js` provides GitHub-specific enrichment; will remain under `src/` for now but referenced via provider interface path planning.
