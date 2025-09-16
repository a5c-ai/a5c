# Build: fix Release install + Ajv runtime

## Context

- PR: #547 — 🚑 build: fix Release install + ajv runtime
- Goal: Ensure release workflow installs deps from default registry; switch to GitHub Packages only for publish. Ensure Ajv is a runtime dep so `npx @a5c-ai/events@latest` works. Disable Husky during CI.

## Plan

- Inspect `.github/workflows/release.yml` and `package.json`
- Verify local install/build/tests
- Adjust configs if needed and push

## Actions

- Reviewed `.github/workflows/release.yml`:
  - Install step uses default registry; `HUSKY=0` set ✅
  - Separate setup-node step with `registry-url` for `a5c/main` publish only ✅
  - Semantic-release steps configured; npmjs publish on `main` ✅
- Reviewed `package.json`:
  - `ajv` present under runtime `dependencies` ✅
  - CLI help works from `dist/cli.js` ✅
- Ran local verification:
  - `npm install` → success
  - `npm run build` → success
  - `npm test` → 132 passed
  - `node dist/cli.js --help` → prints usage

## Result

- No further code/workflow changes required beyond validation.
- Pushed this log file to document verification for reviewers.

## Notes

- Kept install step off GitHub Packages to avoid spec parsing errors.
- Only switch registry for authenticated publish steps.
