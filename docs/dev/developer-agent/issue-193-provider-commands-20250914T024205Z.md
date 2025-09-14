# Issue #193 – Provider abstraction and commands structure

## Intent
Align CLI and provider layout with tech-specs:
- Add `src/commands/normalize.ts` and `src/commands/enrich.ts`.
- Rewire `src/cli.ts` to use commands.
- Move GitHub-specific enrichment under `src/providers/github/`.
- Keep public API stable (re-export from old paths) and keep tests green.

## Plan
1) Create commands modules and proxy old paths
2) Move `enrichGithubEvent` under providers and add proxy at root
3) Adjust imports and build
4) Run tests, update this log with results
