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

### PR Titles

Pull request titles must also follow Conventional Commits format. Titles are enforced as:

- Blocking for PRs targeting `a5c/main`.
- Warning-only (non-blocking) for PRs targeting `main`.

Example PR title: `feat: add normalize CLI flag`.

## Commit Message Validation (Local)

We include a Husky `commit-msg` hook that validates your commit message using Commitlint. The hook calls `npx commitlint --edit "$1"` as defined in `.husky/commit-msg` and reads rules from `commitlint.config.cjs` (extends `@commitlint/config-conventional`). If a commit is rejected, adjust the message to match the format above. See also `docs/contributing/git-commits.md`.

## Commit Hygiene and Pre-commit Hook

For more details, see `docs/ci/commit-hygiene.md`. Run `npm run commit:prepare` if hooks are missing. You can bypass pre-commit with `A5C_SKIP_PRECOMMIT=1` or `SKIP_PRECOMMIT=1` in emergencies (legacy `SKIP_CHECKS=1` is also honored). The pre-commit also guards against Windows-invalid `:` in filenames.

We enforce fast pre-commit checks to keep branches healthy. The Husky pre-commit hook delegates to `scripts/precommit.sh`, which runs:

- Filename guard: blocks Windows-invalid `:` in staged filenames.
- Artifact guard: blocks committing generated artifacts under `coverage/**` and `dist/**`.
- Size guard: fails if any staged file exceeds a size threshold (default 1 MiB).
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
# Pre-commit bypass
SKIP_PRECOMMIT=1 git commit -m "wip: bypass pre-commit"
# or
A5C_SKIP_PRECOMMIT=1 git commit -m "wip: bypass pre-commit"

# Pre-push bypass
SKIP_PREPUSH=1 git push
# or
A5C_SKIP_PREPUSH=1 git push
```

The scripts also recognize the legacy `SKIP_CHECKS=1` in some hooks. Use the explicit vars above when possible. Please follow up with a separate commit to address issues.

### Configuration

- Max file size: override with `PRECOMMIT_MAX_SIZE_BYTES` (default `1048576` bytes, i.e., 1 MiB).
- Blocked paths: any staged files under `coverage/**` or `dist/**` are rejected. If you must commit build outputs, place them outside these directories or adjust your workflow (e.g., publish artifacts).

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

## Coverage Gate Policy

This repository supports an optional coverage hard gate for pull requests.

- When it applies: PRs targeting `a5c/main`.
- How it’s enabled: Maintainers toggle the repository variable `REQUIRE_COVERAGE` to `true`.
  - Workflows check `vars.REQUIRE_COVERAGE == 'true'` and fail the PR if coverage is below thresholds.
  - See: `.github/workflows/tests.yml`, `.github/workflows/pr-tests.yml`, `.github/workflows/quick-checks.yml`.
- Thresholds source of truth: `scripts/coverage-thresholds.json`.
  - Current values in this repo: `lines: 55`, `branches: 55`, `functions: 60`, `statements: 55`.
  - If the file is missing, Vitest falls back to `lines: 60`, `branches: 55`, `functions: 60`, `statements: 60` (see `vitest.config.ts`).
- Temporary override (exceptional cases): A maintainer can temporarily set `REQUIRE_COVERAGE` to `false` to allow merging while documenting the rationale in the PR.

### Adjusting Thresholds

1. Edit `scripts/coverage-thresholds.json` in a PR (example):

   ```json
   {
     "lines": 60,
     "branches": 55,
     "functions": 60,
     "statements": 60
   }
   ```

2. Include a short rationale in the PR description (e.g., significant new surface added, temporary dip, or sustained improvements justifying a raise).
3. When `REQUIRE_COVERAGE` is `true`, CI will enforce these thresholds on PRs into `a5c/main`.

### Local Coverage

- Run tests with coverage locally: `npm test` (Vitest produces `coverage/` and a `coverage-summary.json`).
- CI publishes a coverage summary and, when gated, fails if below thresholds. For details, check the coverage gate steps in the workflows above.

References: `vitest.config.ts`, `scripts/coverage-thresholds.json`.

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

## Line Endings and .gitattributes

This repository enforces LF (Unix-style) line endings via a root `.gitattributes`:

- All text files normalize to LF: `* text=auto eol=lf`
- Lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) are explicitly LF
- Shell scripts (`*.sh`) are LF
- Common binary formats (e.g., PNG/JPG/WEBP) are marked `binary`

Why: consistent line endings prevent noisy diffs and merge conflicts across macOS, Linux, and Windows.

### Windows guidance

- Git will respect `.gitattributes` and keep LF endings in your working tree.
- Recommended Git config for Windows contributors:

```
# Keep LF in the working tree and repository
git config --global core.autocrlf false
# Optional: make LF explicit
git config --global core.eol lf
```

Most editors (VS Code, JetBrains, Notepad++, etc.) handle LF on Windows.
- VS Code: set `"files.eol": "\n"` and ensure the status bar shows `LF`.

If you ever need to re-normalize line endings locally after changing Git settings:

```
git rm --cached -r .
git reset --hard
# or, minimally normalize staged files
# git add --renormalize .
```

Do not commit generated artifacts under `coverage/**` or `dist/**`.
