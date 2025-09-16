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
