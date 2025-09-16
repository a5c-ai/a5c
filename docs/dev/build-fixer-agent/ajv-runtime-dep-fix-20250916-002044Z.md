# Fix: add missing runtime dependency ajv

- Trigger: failed run https://github.com/a5c-ai/events/actions/runs/17750345080
- Root cause: dist/cli.js imports ajv at top-level; package.json lists ajv only in devDependencies. npx install does not include dev deps, causing ERR_MODULE_NOT_FOUND.

## Plan

1. Move ajv to dependencies
2. Build locally and sanity run CLI
3. Open PR to a5c/main

## Verification

- npm run build
- node dist/cli.js --help
- node -e "require('ajv'); console.log('ajv-ok')"
