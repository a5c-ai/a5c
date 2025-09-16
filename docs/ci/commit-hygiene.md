# Commit Hygiene and Local Hooks

This repo enforces lightweight local checks to keep commits and branches healthy. Hooks are managed by Husky and configured to be fast and focused.

## Summary

- commit-msg: Validates Conventional Commits via Commitlint (emoji prefix allowed before type).
- pre-commit: Runs staged-file hygiene and lint-staged (ESLint + Prettier).
- pre-push: Typecheck and related tests.

## Bypass Flags (use sparingly)

- `A5C_SKIP_PRECOMMIT=1` or `SKIP_PRECOMMIT=1`: bypass pre-commit checks.
- Legacy: `SKIP_CHECKS=1` is also recognized by the script.
- `A5C_SKIP_PREPUSH=1` or `SKIP_PREPUSH=1`: bypass pre-push checks.

Always follow up with a fix commit if you bypass.

## Windows Filename Guard

The pre-commit script blocks staged filenames containing `:` because these are invalid on Windows checkouts. Please rename such files (e.g., replace `:` with `-`).

## Whitespace and EOF Checks

Git’s built-in checker runs via `git diff --cached --check` to prevent trailing whitespace and ensure a final newline at EOF.

## lint-staged

Only staged files are linted/formatted to keep hooks fast. See `package.json` `lint-staged` for exact patterns.

## Conventional Commits

Format: `type(scope)?: subject`

Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test

Examples:

- `feat(cli): add validate command`
- `fix(parser)!: handle null inputs`
- `docs: update README quickstart`

Commit messages are validated by the `commit-msg` hook using `commitlint.config.cjs`.

## Quick Setup

If hooks aren’t running after install, prepare them:

```
npm run commit:prepare
```

This calls Husky to (re)install hooks and prints status.
