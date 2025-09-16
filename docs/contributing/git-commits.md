---
title: Conventional Commits
description: Commit message conventions and validation in CI and locally.
---

# Conventional Commits

We follow Conventional Commits for clear history and automated releases.

## Format

`<type>(<scope>): <subject>`

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
Scope: kebab-case module or area (optional). Subject: imperative, no period.

Examples:

- `feat(cli): add validate command`
- `fix(enrich): handle missing files edge case`
- `docs: update README quick start`

## Validation

- Local: Husky `commit-msg` hook runs commitlint via `npx commitlint --edit "$1"` (see `.husky/commit-msg`). Rules live in `commitlint.config.cjs` and extend `@commitlint/config-conventional`.
- CI: PR check validates all commit messages.

## Template

Use `.gitmessage.txt` as a template:

```
git config commit.template .gitmessage.txt
```

## Breaking Changes

Include a `BREAKING CHANGE:` footer when applicable. Example:

```
feat(api): remove deprecated normalize flags

BREAKING CHANGE: --select requires comma-separated values
```
