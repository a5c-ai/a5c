# CI fix: npx runtime Ajv dependency

## Context

- Failing workflow: `.github/workflows/packages-npx-test.yml`
- Run: https://github.com/a5c-ai/events/actions/runs/17753063970
- Failure: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ajv'` when running `npx @a5c-ai/events --help`.

## Root cause

`ajv` used by `src/cli.ts` at runtime was listed under `devDependencies`, so it is not present in the published package consumed by `npx`.

## Plan

1. Move `ajv` (and `ajv-formats` used by library validator) to runtime `dependencies`.
2. Install, build, and sanity-run `node dist/cli.js --help` locally.
3. Open PR against `a5c/main` and link failed run.

## Verification steps

- `npm install && npm run build`
- `node dist/cli.js --help` should print without module-not-found.
- CI Packages Npx Test should pass (`npx @a5c-ai/events@latest --help`).
