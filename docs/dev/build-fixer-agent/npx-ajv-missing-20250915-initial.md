# Build Fix: npx @a5c-ai/events fails due to missing Ajv

- Context: Packages Npx Test failing with `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'` when executing `npx @a5c-ai/events@latest --help`.
- Root cause (suspected): `ajv` is in devDependencies, but CLI imports it at runtime at top-level; published package thus lacks `ajv`.

## Plan

- Move `ajv` to runtime dependencies in package.json (minimal fix).
- Build locally and run `node dist/cli.js --help`.
- Open PR targeting `a5c/main` with details and logs.
