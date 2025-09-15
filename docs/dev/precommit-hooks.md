# Pre-commit hooks and local tooling

This repo uses Husky to run fast checks locally:

- pre-commit: lint-staged on staged files (ESLint + Prettier)
- pre-push: TypeScript typecheck and targeted tests (Vitest related)

## Install

Run `npm install` once; Husky will install hooks automatically. Node >= 20 is required.

## Skipping

- Skip pre-commit: set `A5C_SKIP_PRECOMMIT=1` or `SKIP_PRECOMMIT=1`
- Skip pre-push: set `A5C_SKIP_PREPUSH=1` or `SKIP_PREPUSH=1`

## Speed tips

- Keep commits small to reduce files linted by lint-staged.
- Pre-push runs vitest `related` for changed files since `origin/a5c/main`; if none match, it runs the full suite.

## Troubleshooting

- If hooks do not run, execute `npx husky install`.
- On Windows filename constraints, pre-commit blocks staged filenames containing `:`.
