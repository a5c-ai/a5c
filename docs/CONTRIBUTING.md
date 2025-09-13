# Contributing

This repo enforces Conventional Commits and fast pre-commit checks.

## Commit messages

We follow Conventional Commits (feat, fix, docs, chore, refactor, test, build, ci, perf, etc.). A `commit-msg` hook validates messages locally using commitlint.

Examples:

- `feat(cli): add filter flags`
- `fix(parser): guard null event payload`

## Local setup

1. Install dependencies: `npm ci`
2. Husky installs via `prepare` automatically. If not, run `npm run prepare`.

## Pre-commit

We use `lint-staged` to only run tools on staged files.

What runs:

- ESLint + Prettier on staged TypeScript files
- Prettier on common text formats

## Build on install

To keep installs fast, we moved the build from `prepare` to `prepack`. Running `npm install` will not build TypeScript.

## CI

PRs run a lightweight commitlint job to enforce Conventional Commits server-side.
