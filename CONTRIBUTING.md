# Contributing

Thanks for contributing to @a5c-ai/events! This project follows Conventional Commits for clear history and automated releases.

## Conventional Commits

Format: `type(scope)?: subject`

Allowed types:
- build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test

Examples:
- `feat(cli): add validate command`
- `fix(parser)!: handle null inputs`
- `docs: update README quickstart`

Notes:
- Use `!` for breaking changes after the type/scope, and describe the change in the body.
- Keep the first line under ~72 chars when possible.

## Commit Message Validation (Local)

We include a Husky `commit-msg` hook that validates your commit message via `scripts/commit-verify.ts`. If a commit is rejected, adjust the message to match the format above.

## Commit Hygiene and Pre-commit Hook

We enforce fast pre-commit checks to keep `main` and `a5c/main` healthy:

- Staged file hygiene: trailing whitespace and end-of-file newline via `git diff --check`.
- Filename guard: blocks Windows-invalid `:` in staged filenames.
- Lint and typecheck: runs `npm run lint` and `npm run typecheck`.
- Tests: runs `vitest` with `--passWithNoTests` when test or source files are staged.

The hook is implemented in `scripts/precommit.sh` and invoked from `.husky/pre-commit`.

### Bypass in Emergencies

If you must bypass locally (e.g., to unblock a hotfix), you can temporarily set:

```
SKIP_CHECKS=1 git commit -m "wip: bypass pre-commit"
```

Please follow up with a separate commit to address lint/typecheck/test issues.

### Running Checks Manually

You can run the pre-commit script directly:

```
scripts/precommit.sh
```

Or individual commands:

```
npm run lint
npm run typecheck
npm test -- --passWithNoTests
```

## CI Validation

Pull requests to `a5c/main` run fast checks:

- Commit hygiene: validates PR title and commit messages.
- Lint workflow: runs `npm run lint` and `npm run typecheck` on PRs to `a5c/main` and `main`.

If any check fails, edit the PR title, reword commits, or fix code issues accordingly.

## Getting Started

1. Install dependencies: `npm ci`
2. Build: `npm run build`
3. Run tests: `npm test`

Please keep changes scoped and include tests when adding functionality.
