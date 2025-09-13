# [Low] Tests lint noise: no-explicit-any and parser config

### Category
tests / linting

### Context
Running `npm run lint` flags multiple violations in test files (e.g., `tests/enrich.basic.test.ts`, `tests/normalize.*.test.ts`) related to `@typescript-eslint/no-explicit-any`, unused vars, and a parser project warning for a generated `src/types.d.ts`.

### Impact
Non-blocking. CI currently passes unit tests; the lint errors predate this PR and are unrelated to the change (defaulting `include_patch=false`). They can create noise and slow contributors who run `npm run lint` locally.

### Suggestions
- Relax or scope rules for test files in `eslint.config.js` (e.g., disable `no-explicit-any` under `tests/**`), or add focused overrides.
- Alternatively, annotate intentional `any` in tests with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` where appropriate.
- Exclude generated declaration files (e.g., `src/**/*.d.ts`) from lint or adjust parser `project` settings to avoid parse errors.

### Evidence
- Lint run surfaced ~20+ errors in tests; unit tests all pass (22/22).

### Priority
low priority

