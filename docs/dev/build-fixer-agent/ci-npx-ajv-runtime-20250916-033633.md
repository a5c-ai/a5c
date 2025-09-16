# Build Fix: npx ERR_MODULE_NOT_FOUND for Ajv

## Context

- Workflow: Packages Npx Test
- Failure: Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ajv' imported from dist/cli.js
- Run: https://github.com/a5c-ai/events/actions/runs/17753615852

## Plan

- Move `ajv` to runtime `dependencies`
- Install, build, verify `node dist/cli.js --help`
- Open PR with fix and context

## Notes

Ajv is imported at runtime by `src/cli.ts` for `validate` command. It must be a runtime dependency for the published package.

## Verification

- Installed deps and built locally.
- `node dist/cli.js --help` runs without Ajv module error.

## Change Summary

- Move `ajv` from devDependencies to dependencies.
