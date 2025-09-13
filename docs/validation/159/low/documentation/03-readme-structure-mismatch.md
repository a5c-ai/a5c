# [Low] README structure references mismatch

Category: documentation
Priority: low priority

The README "Project structure" section references `src/commands/*` and `src/enrichers/*`, which do not exist. Actual files are `src/normalize.ts` and `src/enrich.ts` per current implementation.

Recommendations:
- Align README with current source layout, or refactor code to match the documented structure. If refactor is planned, add a note indicating future structure vs current.

References:
- README.md (Project structure)
- src/cli.ts, src/normalize.ts, src/enrich.ts

