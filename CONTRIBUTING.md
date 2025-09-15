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

We include a Husky `commit-msg` hook that validates your commit message using Commitlint. The hook calls `npx commitlint --edit "$1"` as defined in `.husky/commit-msg` and reads rules from `commitlint.config.cjs` (extends `@commitlint/config-conventional`). If a commit is rejected, adjust the message to match the format above. See also `docs/contributing/git-commits.md`.

## Commit Hygiene and Pre-commit Hook

We enforce fast pre-commit checks to keep branches healthy. The Husky pre-commit hook delegates to `scripts/precommit.sh`, which runs:

- Filename guard: blocks Windows-invalid `:` in staged filenames.
- Staged file hygiene: trailing whitespace and end-of-file newline checks (`git diff --cached --check`).
- Lint-staged: runs ESLint/Prettier only on staged files per `package.json` `lint-staged` config.

Current lint-staged configuration (see `package.json`):

```
{
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
}
```

Pre-push checks run TypeScript typecheck and tests (see `.husky/pre-push`).

### Husky setup (prepare-based)

We use Husky v9 with a `prepare` script so hooks are set up only for contributors (not package consumers):

```
"scripts": {
  "prepare": "husky && npm run build"
}
```

Notes:

- `prepare` runs on local `npm install` and during development; CI can call `npm ci` which also runs `prepare`.
- We chain `npm run build` to keep the existing behavior of building on install.
- We intentionally removed the deprecated `postinstall: \"husky install\"` to eliminate CI noise.

### Bypass in Emergencies

If you must bypass locally (e.g., to unblock a hotfix), you can temporarily set one of:

```
SKIP_PRECOMMIT=1 git commit -m "wip: bypass pre-commit"
# or
A5C_SKIP_PRECOMMIT=1 git commit -m "wip: bypass pre-commit"
```

The script also recognizes the legacy `SKIP_CHECKS=1`. Use the explicit vars above when possible. Please follow up with a separate commit to address issues.

### Running Checks Manually

You can run the pre-commit script directly:

```
scripts/precommit.sh
```

Or individual commands:

```
npm run lint
npm run typecheck
npx vitest run --passWithNoTests
```

## CI Validation

Pull requests to `a5c/main` run fast checks (Node 20):

- Commit hygiene: validates PR title and commit messages.
- Lint workflow: runs `npm run lint` and a separate Typecheck step (src-only).

Example snippet:

```
  - name: Lint
    run: npm run lint
  - name: Typecheck (src-only)
    run: npm run typecheck
```

`typecheck` uses `tsconfig.typecheck.json` and checks `src/**`. Tests are type-checked within the Vitest run. A separate `Typecheck` workflow runs on Node 20 and 22 for compatibility.

## Getting Started

1. Node: `nvm use` (repo includes `.nvmrc` → Node 20.x LTS)
2. Install dependencies: `npm ci`
3. Build: `npm run build`
4. Run tests: `npm test`

Please keep changes scoped and include tests when adding functionality.

## Node.js Version Policy

We target Node 20.x LTS across CI and local development.

- The repository includes an `.nvmrc` pinning Node `20` for local parity.
- If you use `nvm`, run `nvm use` in the project root to select the correct version.
- `package.json` declares `"engines": { "node": ">=20" }`; while Node 22 may work, CI validates and ships with Node 20.
