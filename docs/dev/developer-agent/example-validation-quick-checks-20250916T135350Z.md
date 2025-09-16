# Example validation – resilient CI and docs (Issue #699)

## Plan

- Add docs section in `docs/ci/ci-checks.md`: Example Validation (ajv-cli + CLI)
- Pin ajv-cli/ajv-formats in Quick Checks and add CLI fallback
- Add npm script `validate:examples` to run both checks locally

## Context

- Workflow: `.github/workflows/quick-checks.yml`
- Schema: `docs/specs/ne.schema.json`
- CLI: `events validate` (lazy-loads Ajv; supports `--schema`)
- Example: output from normalize pipeline or a saved file

## Notes

- Pin ajv-cli@5 and ajv-formats@3 to match project runtime Ajv v8.
- Fallback path uses `node dist/cli.js validate` to avoid npx network dependency.
