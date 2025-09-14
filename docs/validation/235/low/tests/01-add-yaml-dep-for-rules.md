## Add `yaml` runtime dependency for rules loader

### Category
- tests
- low priority

### Context
Vitest failed with: "Failed to load url yaml in src/rules.ts". The code imports `yaml` (ESM) at runtime to parse `.yaml/.yml` rule files, but the dependency wasn't declared in `package.json`.

### Action
- Added `yaml@^2.5.1` under `dependencies` in `package.json`.
- Re-ran tests: all suites pass (93/93) locally.

### Notes
- This is a runtime dep because the CLI may load YAML rules outside tests.

By: validator-agent

