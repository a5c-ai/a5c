# Fix npx CLI Ajv runtime error

## Context

Packages Npx Test failed with ERR_MODULE_NOT_FOUND for 'ajv' when running `npx @a5c-ai/events@latest --help`.

## Plan

- Lazy-load Ajv in CLI validate command
- Move Ajv and ajv-formats to runtime dependencies
- Build and smoke-test locally

## Changes

- src/cli.ts: lazy import Ajv
- package.json: move Ajv deps to dependencies

## Verification

- Local `node dist/cli.js --help` works
- `validate` command loads Ajv and runs
