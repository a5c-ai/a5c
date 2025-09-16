# [Validator] [Tests] - Exclude legacy JS test stubs from vitest run (documented)

- Priority: low
- Context: PR #96 on branch `feat/producer-tests-issue91`

## Summary

Vitest is configured to include TypeScript tests under `tests/` and `test/`. There are legacy JS test stubs that are duplicated by TS equivalents. The config currently excludes `dist/**` and `node_modules/**`, but not `**/*.js`. Practically, Vitest will still match only `*.test.ts` / `*.spec.ts` via `include`, so JS files won’t run; this note documents the intent and ensures future contributors don’t re-enable JS tests inadvertently.

## Recommendation

- Keep `include` narrowed to TS patterns.
- Optionally add a comment in `vitest.config.ts` clarifying that JS tests are deprecated and intentionally excluded by pattern.

## Rationale

This avoids confusion and speeds up test discovery while TS becomes the single source of truth for tests.
