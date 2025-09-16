# Build Fix: Release install registry + ajv runtime

- Run: https://github.com/a5c-ai/events/actions/runs/17751795469
- Branch: a5c/main
- Start: 20250916T014905Z

## Context
Release workflow failed at Install.  is expected to fail (no lockfile), but fallback  errored: Unknown command: "error"

To see a list of supported npm commands, run:
  npm help.

## Hypothesis
- setup-node sets default registry to GitHub Packages; this can break installs for public packages and produce the error.
- Also, CLI imports Ajv at runtime; ensure  (and ) are runtime dependencies to fix npx.

## Plan
1. Do not override default registry during install (use npmjs). Let  map scope-only to GPR.
2. Add job-level  to avoid hook noise during CI install.
3. Move  (+ formats) to .
4. Validate locally: install, build, quick tests.

## Progress Log
- [ ] Update workflow: registry + HUSKY
- [ ] package.json deps move
- [ ] Local build
- [ ] Push PR
