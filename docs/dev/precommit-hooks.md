# Pre-commit hooks and local tooling

This repo uses Husky to run fast checks locally:

- pre-commit: staged-file hygiene + lint-staged (ESLint + Prettier)
- pre-push: TypeScript typecheck and targeted tests (Vitest related)

## Checks performed (pre-commit)

The `.husky/pre-commit` hook delegates to `scripts/precommit.sh`, which enforces:

- Filename guard: blocks staged filenames containing `:` (breaks Windows checkouts).
- Whitespace/newline hygiene: `git diff --cached --check` must pass.
- lint-staged: runs ESLint and Prettier on staged files only.

### Optional: local secret scanning (Gitleaks)

- Opt-in local scan for staged changes using `gitleaks protect --staged -v`.
- Disabled by default to keep commits fast. Enable by setting either:
  - `A5C_PRECOMMIT_GITLEAKS=1`, or
  - `PRECOMMIT_GITLEAKS=1`
- If the `gitleaks` binary is not installed, the step is skipped with a notice.
- CI remains the source of truth via `.github/workflows/gitleaks.yml`.

## Install

Run `npm install` once; Husky will install hooks automatically. Node >= 20 is required.

To enable local Gitleaks scan, install `gitleaks`:

- macOS (Homebrew): `brew install gitleaks`
- Linux (deb): `curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_amd64.deb -o gitleaks.deb && sudo dpkg -i gitleaks.deb`
- Linux (tar): download the tarball from Releases and place `gitleaks` in your `PATH`
- Windows (scoop): `scoop install gitleaks`

Then export one of the toggles in your shell profile (or inline for a single commit):

```
export A5C_PRECOMMIT_GITLEAKS=1
# or
export PRECOMMIT_GITLEAKS=1
```

## Skipping

- Skip pre-commit: set `A5C_SKIP_PRECOMMIT=1` or `SKIP_PRECOMMIT=1` (legacy `SKIP_CHECKS=1` also works)
- Skip pre-push: set `A5C_SKIP_PREPUSH=1` or `SKIP_PREPUSH=1`

To temporarily bypass only the local Gitleaks step, unset the toggle:

```
unset A5C_PRECOMMIT_GITLEAKS PRECOMMIT_GITLEAKS
```

For false positives, prefer adding allowlists to `gitleaks.toml` or using inline allowlist comments where supported; avoid disabling the scan globally.

## Pre-push details

- Runs `npm run typecheck` (no emit) to catch TypeScript issues quickly.
- Attempts targeted tests via `npm run prepush` (uses `scripts/prepush-related.js`).
- Falls back to `npm run prepush:full` which runs `vitest run` if related tests are not applicable.
- Related scope considers changes since `origin/a5c/main` by default; override with `A5C_BASE_REF`.

### Common failures and fixes

- Type errors: run `npm run build` locally and fix the reported TS errors.
- Failing tests: run `vitest related` for the files in the error output, or `npm run prepush:full` to reproduce.
- If you need to bypass temporarily (e.g., WIP branch): `A5C_SKIP_PREPUSH=1 git push`.

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
