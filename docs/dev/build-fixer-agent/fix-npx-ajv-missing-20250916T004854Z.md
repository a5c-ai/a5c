# Build Fix: npx Ajv runtime missing

- Start: 20250916T004854Z UTC
- Context run: https://github.com/a5c-ai/events/actions/runs/17750805182
- Symptom: npx --help fails with ERR_MODULE_NOT_FOUND: 'ajv' from dist/cli.js
- Plan:
  - Lazy-load Ajv in CLI validate command
  - Move ajv and ajv-formats to runtime deps
  - Update Packages Npx Test to use @a5c-main dist-tag
  - Verify build and basic CLI commands
