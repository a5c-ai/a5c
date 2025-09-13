# Packages Npx Test failure analysis

- Workflow: .github/workflows/packages-npx-test.yml
- Run: https://github.com/a5c-ai/events/actions/runs/17697568269
- Failure: `npx -y @a5c-ai/events --help` exits 127 with `sh: 1: events: not found`
- Root cause:
  - `npx` uses npmjs registry by default unless scoped registry configured. We configure GPR in `~/.npmrc`, but `npx` runs the package’s postinstall/bin under a throwaway env and needs proper `--registry` and full package spec to GPR.
  - Also need `NPM_CONFIG_USERCONFIG` pointing to populated `.npmrc` and ensure auth uses `NODE_AUTH_TOKEN`.
- Fix:
  - Explicitly pass `--registry https://npm.pkg.github.com` and fully qualify the package `@a5c-ai/events@latest`.
  - Pre-create an npmrc in workspace and set `NPM_CONFIG_USERCONFIG` for all steps using npx.
  - Keep fallback to npmjs for other scopes.
- Verification:
  - Built locally; CLI emits help via `node dist/cli.js --help`.
  - Will rely on CI to fetch GPR published versions `1.0.0` / `1.0.0-a5c-main.*`.
