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

## Local Validation

We include a Husky `commit-msg` hook that validates your commit message via `scripts/commit-verify.ts`. If a commit is rejected, adjust the message to match the format above.

## CI Validation

Pull requests to `a5c/main` run a fast "Commit Hygiene" workflow that validates the PR title and the commit messages in the PR. If checks fail, edit the PR title and/or reword commits.

## Getting Started

1. Install dependencies: `npm ci`
2. Build: `npm run build`
3. Run tests: `npm test`

Please keep changes scoped and include tests when adding functionality.

