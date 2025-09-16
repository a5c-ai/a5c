# [Validator] Refactoring - Unify snapshot stabilization helper

### Summary

There are two implementations of `stable(...)`:

- `tests/helpers/snapshot.ts`
- `src/utils/stable.ts`
  They are very similar and risk drifting over time.

### Recommendation

- Deduplicate by exporting a single canonical `stable` from `src/utils/stable.ts` and importing it in tests.
- Ensure the function is part of the build (`dist/utils/stable.js`) for scripts usage.

### Priority

low priority

### Affected Files

- `tests/helpers/snapshot.ts`
- `src/utils/stable.ts`

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)
