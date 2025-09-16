# Build Fix: npx ERR_MODULE_NOT_FOUND: ajv missing

## Context

- Workflow: .github/workflows/packages-npx-test.yml
- Failure: `npx -y @a5c-ai/events@latest --help` fails with `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ajv'` from dist/cli.js.
- Cause: CLI bundles runtime imports of `ajv` (and `ajv-formats` in src/validate.ts) but package.json lists them in devDependencies only, so they are not installed when consumed via npx.

## Plan

- Move `ajv` and `ajv-formats` to runtime dependencies (dependencies).
- Change CLI to lazy-load Ajv only for `validate` command to avoid pulling it for simple help/version.
- Build and run smoke locally.
- Update Packages Npx Test to use dist-tag `a5c-main` if available.

## Notes

Link to failing run: https://github.com/a5c-ai/events/actions/runs/17750660013
