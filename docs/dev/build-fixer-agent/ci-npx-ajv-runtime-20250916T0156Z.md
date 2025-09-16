# Build Fix: Packages Npx Test – ajv runtime dep

Context: Packages Npx Test workflow failed with ERR_MODULE_NOT_FOUND for `ajv` when running `npx @a5c-ai/events@latest --help`.

Root cause: Previously published package version lacked `ajv` as a runtime dependency and imported it at CLI top-level. Current source fixes this (ajv in deps + lazy-load in `validate`), but the workflow tested `@latest`, which may lag the repo.

Plan:

- Keep testing via npx, but install from a locally packed tarball built from the current commit, ensuring parity with what will be published.
- Build, `npm pack`, then `npx -y -p file:./pkg.tgz events ...` for smoke commands.

Verification steps:

- `npm ci && npm run build`
- `PKG=$(npm pack --json | jq -r '.[0].filename')`
- `npx -y -p "file:$PKG" events --help`
- `npx -y -p "file:$PKG" events --version`
- Normalize/enrich samples and jq checks.

Links:

- Failed run: https://github.com/a5c-ai/events/actions/runs/17751905998
