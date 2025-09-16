## Refactoring: Deduplicate source normalization helper

### Context

The `normalizeSource` helper exists in two locations:

- `src/commands/normalize.ts`
- `src/providers/github/map.ts`

Both implement identical logic to accept `actions` as an alias and persist the canonical `action` value. Duplicating this logic risks drift.

### Recommendation

- Extract a single utility (e.g. `src/utils/source.ts`) exporting `normalizeSource(...)`.
- Reuse it from both call sites to ensure consistent behavior and easier future changes.

### Priority

low
