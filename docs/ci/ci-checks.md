# CI Checks and Triggers

This repo uses a fast/slow split for CI to keep PR feedback under a few minutes while gating heavier work on protected branches.

## Quick Checks (PR)

- Name: `Quick Checks`
- Triggers: `pull_request` to `a5c/main`, `main`
- Node: 20 (cache: npm)
- Steps:
  - `npm ci`
  - `npm run lint` (eslint)
  - `npm run typecheck` (tsc --noEmit)
  - `npm run test:ci` (vitest with coverage)
  - Artifacts: `coverage/lcov.info`, `coverage/coverage-summary.json`
  - Step summary: Coverage table appended to the job summary

Recommended as a required PR check.

## Lint (PR)

- Name: `Lint`
- Triggers: `pull_request` to `a5c/main`, `main`
- Node: 20 (via `.nvmrc`)
- Steps: `npm ci`, `npm run lint`

Runs independently to provide fast, focused lint feedback. Quick Checks also lints, so keeping both is optional for enforcement but useful for clarity.

## Typecheck (PR)

- Name: `Typecheck`
- Triggers: `pull_request` to `a5c/main`, `main`
- Matrix: Node 20, 22
- Steps: `npm ci`, `npm run typecheck` with a job summary per node version

Runs independently to surface TS errors early across supported Node versions. Quick Checks also typechecks.

## Build and Unit Tests (Push gates)

- Name: `Build`
- Triggers: `push` to `a5c/main`, `main`
- Steps: `./scripts/build.sh`

- Name: `Tests`
- Triggers: `push` and `pull_request` to `a5c/main` (lightweight; mirrors Quick Checks but uploads coverage artifacts for diagnostics)
- Steps: `./scripts/install.sh`, `./scripts/build.sh`, `./scripts/test.sh`, CLI smoke tests, coverage artifact + step summary

Heavier/longer gates run on protected branches to keep PRs snappy while maintaining strong guarantees before merge/deploy.

## Coverage Upload (Optional: Codecov)

You can optionally upload coverage to Codecov and display a badge. Uploads are disabled by default and only run when a token is configured.

Prerequisites

- Create a Codecov project for this repository.
- Add a repository Secret or Variable named `CODECOV_TOKEN`.

Script

- Use `scripts/coverage-upload.sh`. It:
  - No-ops if `CODECOV_TOKEN` is not set or `coverage/lcov.info` is missing.
  - Uploads using Codecov's bash uploader from `https://codecov.io/bash`.
  - Never fails the build if token is missing or file is absent (script exits 0).

Enable in Tests workflow (example snippet)

Add a step after tests to upload coverage. Do not commit this change unless your org opts in.

```yaml
- name: Upload coverage to Codecov (optional)
  if: ${{ env.CODECOV_TOKEN != '' }}
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
  run: |
    bash scripts/coverage-upload.sh
```

Optional environment variables:

- `CODECOV_FLAGS`: e.g., `tests,vitest`
- `CODECOV_BUILD`: build identifier (commit SHA or run id)
- `CODECOV_URL`: override the uploader host for self-hosted instances
- `CODECOV_DRY`: set to `1` to print the upload command and skip execution

Badge (README)

See README for an optional badge snippet when enabled.

## Commit Hygiene (PR)

- Name: `Commit Hygiene`
- Triggers: `pull_request` to `a5c/main`
- Validates PR title and commit messages against Conventional Commits (non-blocking title validation; commits enforced).

## a5c Router Integration

The agent router (`.github/workflows/a5c.yml`) listens for `workflow_run.completed` events from:

- `Build`, `Deploy`, `Packages Npx Test`, `Lint`, `Tests`, `Quick Checks`, `Typecheck`, `Commit Hygiene`.
  It filters to failed runs on `a5c/main` and `main` and can dispatch follow-ups automatically.

## Repository Settings (Recommended)

Under Settings → Branches → Branch protection rules for `a5c/main` and `main`, configure:

- Required status checks: `Quick Checks` (recommended), optionally `Lint`, `Typecheck`.
- Ensure “Require branches to be up to date before merging” to include these checks.

Notes

- Vitest coverage writes `coverage/lcov.info` and `coverage/coverage-summary.json` (enabled via `vitest.config.ts`).
- `scripts/*` are the single source of truth for install/build/test and are used by workflows for consistency.
