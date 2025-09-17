# Build Fix: Unit test failures in emit and generate_context

Started: 2025-09-17T09:21:04Z

Context:

- Trigger: workflow_run failure on branch `a5c/main` (Tests)
- Failed run: https://github.com/a5c-ai/events/actions/runs/17792750298

Failures observed:

- test/emit.labels.test.ts: TypeError: `parseGithubEntity` is not a function
- test/generateContext.test.ts: expected `List: x y` but rendered `[object global]` entries inside an `each` block

Plan:

- Export `parseGithubEntity` from `src/emit.ts` so tests can access it.
- Fix template engine to bind `this` for expressions within `{{#each}}` blocks by invoking the evaluator with the correct `this` context.
- Run focused tests, then full test suite.
- Open a draft PR against `a5c/main` with details and verification.

Verification steps (to run locally / CI):

- `npx vitest run test/emit.labels.test.ts test/generateContext.test.ts`
- `npm run test:ci`

Notes:

- Category: 1 (Project build errors) — code fixes to satisfy tests.
