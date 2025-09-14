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
