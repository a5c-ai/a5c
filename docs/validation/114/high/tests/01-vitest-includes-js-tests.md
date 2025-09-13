# Vitest does not include `.js` tests under `tests/`

Priority: high
Category: tests

Observed that `tests/enrichGithubEvent.test.js` is not executed by `vitest` because `vitest.config.ts` sets:

- `include: ['test/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts']`
- `exclude: ['**/*.js', 'dist/**', 'node_modules/**']`

As a result, JavaScript test files in `tests/` are ignored.

Suggestions:
- Prefer converting JS tests to TS (rename to `.ts`) to align with config; or
- Adjust `vitest.config.ts` to include `*.js` test files, e.g., `include: ['test/**/*.{test,spec}.{ts,js}', 'tests/**/*.{test,spec}.{ts,js}']`, and remove the global `exclude: ['**/*.js', ...]`.

Impact: test coverage for the new enrichment logic may be under-reported when run via `npm test`.
