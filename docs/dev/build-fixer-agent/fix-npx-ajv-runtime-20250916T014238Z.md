# Build Fix: npx runtime cannot find ajv

Context: Packages Npx Test workflow failed with ERR_MODULE_NOT_FOUND for 'ajv' when running `npx @a5c-ai/events@latest`.

Plan:

- Move ajv to production dependencies (runtime) or remove direct import in CLI.
- Ensure CLI validate command avoids ajv-formats runtime issues.
- Build and smoke-test locally.
- Open PR linking failed workflow run.
