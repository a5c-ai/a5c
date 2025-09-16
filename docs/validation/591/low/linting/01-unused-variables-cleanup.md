# [Validator] [Linting] - Remove unused variables reported by typecheck

## Findings

- `src/cli.ts`: lines around 141 and 190 report unused variables (`_`, `output`).
- `src/enrich.ts`: line around 527 reports `normalizeCodeCommentLocation` unused.

## Recommendation

- Remove or use the variables, or add explicit underscores/naming and disable only if intentional at the narrowest scope.

## Priority

- low priority
