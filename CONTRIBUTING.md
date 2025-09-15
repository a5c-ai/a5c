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

- Filename guard: blocks Windows-invalid `:` in staged filenames.
- Staged file hygiene: trailing whitespace and end-of-file newline checks.
- Lint and typecheck: runs `npm run lint` and `npm run typecheck`.
  - Note: typecheck is source-focused to stay fast.
- Tests: runs Vitest. If possible, runs related tests for changed files via `scripts/prepush-related.js`; otherwise runs `vitest run --passWithNoTests`.

The hook is implemented in `scripts/precommit.sh` and invoked from `.husky/pre-commit`.

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

1. Node: `nvm use` (repo includes `.nvmrc` → Node 20)
2. Install dependencies: `npm ci`
3. Build: `npm run build`
4. Run tests: `npm test`

Please keep changes scoped and include tests when adding functionality.

## Node.js Version Policy

We target Node 20 LTS across CI and local development.

- The repository includes an `.nvmrc` pinning Node `20` for local parity.
- If you use `nvm`, run `nvm use` in the project root to select the correct version.
- `package.json` declares `"engines": { "node": ">=20" }`; while Node 22 may work, CI validates and ships with Node 20.
