# Build Fix: npx runtime Ajv import failure

Date: 2025-09-16

## Context

- Workflow: Packages Npx Test (`.github/workflows/packages-npx-test.yml`)
- Failing run: https://github.com/a5c-ai/events/actions/runs/17751795472
- Symptom: `npx` execution of `@a5c-ai/events` fails due to runtime dependency resolution and/or spec parsing. Prior runs indicated `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'` when CLI imports Ajv at runtime.

## Root Cause

`src/cli.ts` imports `ajv` at runtime for the `validate` command and schema compilation. However, `ajv` was listed under `devDependencies` in `package.json`. When consumers run the CLI via `npx`, devDependencies are not installed, leading to missing module errors.

## Fix

- Move `ajv` from `devDependencies` to `dependencies`.
- Keep `ajv-formats` in dev since the CLI avoids it at runtime; programmatic validation paths that need it are exercised in tests/scripts.

## Verification (local)

- `npm run build` succeeds.
- `node dist/cli.js --help` prints usage.
- `node dist/cli.js normalize --in samples/workflow_run.completed.json --out out.normalize.json` succeeds and produces expected shape (type=workflow_run).

## Notes

- If `npx` continues to error with `must provide string spec` on GH runners, adjust the workflow to avoid non-existent tags (e.g., `@a5c-main`) and ensure `NPM_CONFIG_USERCONFIG` is exported before invoking `npx`.

## Results

- Moved `ajv` to runtime `dependencies` with version `^8.17.1`.
- Local build and CLI smoke tests succeeded.
- Opened PR #545: https://github.com/a5c-ai/events/pull/545 (auto-merge enabled).
