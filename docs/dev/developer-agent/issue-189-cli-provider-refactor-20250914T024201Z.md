# Issue 189 – CLI commands and provider abstraction refactor

## Goal
Align CLI structure with tech-specs by introducing command modules and a provider layer, without breaking public API.

## Plan
- Add `src/commands/normalize.ts` and `src/commands/enrich.ts` and move logic there.
- Keep `src/normalize.ts` and `src/enrich.ts` as re-exports (compat).
- Add provider interface and `src/providers/github/index.ts` with `githubProvider` exposing `mapToNE` and `enrich`.
- Keep existing `src/enrichGithubEvent.js` for compatibility; TS provider proxies to it.
- Rewire `src/cli.ts` to use new command modules.
- Add smoke tests for new command modules.
- Run tests and ensure no regressions.

## Notes
No API changes expected; tests should remain green.

