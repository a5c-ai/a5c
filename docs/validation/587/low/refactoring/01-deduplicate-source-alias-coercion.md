# [Validator] [Refactoring] - Deduplicate `source` alias coercion

### Summary

`actions` -> `action` coercion exists in two places:

- `src/commands/normalize.ts` (command layer)
- `src/providers/github/map.ts` (provider mapping)

This duplication is non-blocking but may drift over time.

### Recommendation

Create a small shared helper (e.g. `src/utils/source.ts`) exporting `coerceSource()` and use it in both modules. Add a unit test for this utility.

### Priority

low priority

### Context

- PR: #587
- Files: `src/commands/normalize.ts`, `src/providers/github/map.ts`
