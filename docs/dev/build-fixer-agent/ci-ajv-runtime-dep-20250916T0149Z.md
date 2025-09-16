# build-fixer-agent – CI ajv runtime dependency fix

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17751795467
- Branch: a5c/main @ 84463cc
- Failures:
  - Install step: `npm error must provide string spec`
  - Schema validation step: `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'`

## Root Cause Hypothesis

- `package.json` on a5c/main has `"ajv": null` in dependencies (invalid spec).
- The observability script `scripts/validate-observability.mjs` imports Ajv at runtime.

## Plan

1. Set `dependencies.ajv` to `^8.17.1` (runtime dep).
2. Ensure `ajv` is not in devDependencies.
3. Run `npm ci`, `npm run build`, and schema validator locally.
4. Open PR with details, labels (build, bug), and link failing run.

## Verification Steps

- `npm ci` succeeds.
- `node scripts/validate-observability.mjs` succeeds.
- Build step succeeds.
