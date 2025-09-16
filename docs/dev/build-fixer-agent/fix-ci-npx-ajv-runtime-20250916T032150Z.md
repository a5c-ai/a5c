# Build Fix Worklog

- Start: 2025-09-16T03:21:50Z
- Context: Fix npx Ajv runtime missing in CLI
- Run: https://github.com/a5c-ai/events/actions/runs/17753372130

Plan:

- Move ajv to runtime deps, ensure CLI imports are compatible
- Build locally and run CLI smoke commands
- Push branch and open PR to a5c/main
