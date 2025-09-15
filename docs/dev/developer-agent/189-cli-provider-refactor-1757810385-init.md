# Work log for issue #189

Started: 2025-09-14T00:39:45Z

## Plan

- Add src/commands/normalize.ts and enrich.ts to encapsulate CLI handlers
- Rewire src/cli.ts to delegate to commands modules
- Introduce provider abstraction interface; keep GitHub mapping under providers/github
- Update index exports to preserve API
- Ensure tests still pass; add new tests if needed

## Notes

Baseline tests passing on main before refactor.

## Progress

- Added `src/commands/{normalize,enrich}.ts` and rewired CLI to use them.
- Introduced `src/providers/types.ts` with a `Provider` interface and optional `GitHubProvider` adapter in `providers/github/map.ts`.
- Re-exported command functions and provider types from `src/index.ts` to keep public API consistent and richer.
- Built and ran tests; all existing tests still pass (21/21).

Next: consider follow-up tests specifically for the CLI command pathways (thin wrappers) if needed.
