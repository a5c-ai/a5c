# Pre-commit hooks and local tooling

This repo uses Husky to run fast checks locally:

- pre-commit: staged-file hygiene + lint-staged (ESLint + Prettier)
- pre-push: TypeScript typecheck and targeted tests (Vitest related)

## Checks performed (pre-commit)

The `.husky/pre-commit` hook delegates to `scripts/precommit.sh`, which enforces:

- Filename guard: blocks staged filenames containing `:` (breaks Windows checkouts).
- Whitespace/newline hygiene: `git diff --cached --check` must pass.
- lint-staged: runs ESLint and Prettier on staged files only.

## Install

Run `npm install` once; Husky will install hooks automatically. Node >= 20 is required.

## Skipping

- Skip pre-commit: set `A5C_SKIP_PRECOMMIT=1` or `SKIP_PRECOMMIT=1` (legacy `SKIP_CHECKS=1` also works)
- Skip pre-push: set `A5C_SKIP_PREPUSH=1` or `SKIP_PREPUSH=1`

## Pre-push behavior

- Runs `npm run typecheck` first (no emit, src-only via `tsconfig.build.json`).
- Then runs `npm run prepush` which executes `scripts/prepush-related.js`:
  - Detects changed files vs `origin/a5c/main` and runs `vitest related` for them.
  - If no related tests or on failure, falls back to `vitest run`.
  - Honors `A5C_SKIP_PREPUSH`/`SKIP_PREPUSH` in case you need to bypass locally.

### Fixing failures

- Type errors: run `npm run typecheck` and open the reported files; fix TS annotations or imports.
- Test failures: run `vitest --watch` or `vitest related <file>` to iterate quickly.

## Pre-push details

- Runs `npm run typecheck` (no emit) to catch TypeScript issues quickly.
- Attempts targeted tests via `npm run prepush` (uses `scripts/prepush-related.js`).
- Falls back to `npm run prepush:full` which runs `vitest run` if related tests are not applicable.
- Related scope considers changes since `origin/a5c/main` by default; override with `A5C_BASE_REF`.

### Common failures and fixes

- Type errors: run `npm run build` locally and fix the reported TS errors.
- Failing tests: run `vitest related` for the files in the error output, or `npm run prepush:full` to reproduce.
- If you need to bypass temporarily (e.g., WIP branch): `A5C_SKIP_PREPUSH=1 git push`.

## Speed tips

- Keep commits small to reduce files linted by lint-staged.
- Pre-push runs vitest `related` for changed files since `origin/a5c/main`; if none match, it runs the full suite.

## Troubleshooting

- If hooks do not run, execute `npx husky install`.
- On Windows filename constraints, pre-commit blocks staged filenames containing `:`.

## What lint-staged runs

From `package.json`:

```
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier -w"
  ],
  "{test,tests}/**/*.{ts,tsx,js}": [
    "eslint --fix --max-warnings=0",
    "prettier -w"
  ],
  "**/*.{md,json,yml,yaml}": [
    "prettier -w"
  ]
}
```

The pre-commit script first enforces staged filename safety and whitespace/newline hygiene, then runs lint-staged. See `scripts/precommit.sh`.
