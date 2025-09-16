# Fix Packages Npx Test – Ajv runtime dependency

## Context
The GitHub Actions workflow "Packages Npx Test" fails when running `npx @a5c-ai/events --help` with:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ajv' imported from .../node_modules/@a5c-ai/events/dist/cli.js
```

## Root Cause
`ajv` (and `ajv-formats`) are used at CLI runtime but listed under devDependencies, so they are omitted from the published package.

## Plan
- Move `ajv` and `ajv-formats` to dependencies in package.json
- Install, build, and smoke test CLI locally
- Open PR to a5c/main with explanation and link to failed run

