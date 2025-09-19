# [Validator] [Refactoring] - Remove/rename unused variables flagged by ESLint

### Summary

`npm run lint` surfaces unused variable warnings in:

- `src/emit.ts`
- `src/reactor.ts`

### Recommendation

- Remove unused variables or prefix with `_` if kept intentionally for interface compatibility.
- Keep lint clean to surface future issues clearly.

### Reference

- Rule: `@typescript-eslint/no-unused-vars`
