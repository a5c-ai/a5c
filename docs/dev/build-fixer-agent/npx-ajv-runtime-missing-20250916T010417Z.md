# Build Fix: npx runtime missing dependency (ajv)

## Context

- Failed workflow: Packages Npx Test (.github/workflows/packages-npx-test.yml)
- Failure: `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'` when running `npx @a5c-ai/events@latest`
- Run: https://github.com/a5c-ai/events/actions/runs/17751062323

## Root Cause

`ajv` (and `ajv-formats`) are used at runtime by the CLI and validation modules, but are listed under devDependencies. When installed via npx, devDependencies are not installed, causing runtime failure.

## Plan

1. Move `ajv` and `ajv-formats` from devDependencies to dependencies.
2. Install, build, and run tests locally.
3. Open PR against `a5c/main` with fix and enable auto-merge.

## Progress

- Initialized doc and branch.
