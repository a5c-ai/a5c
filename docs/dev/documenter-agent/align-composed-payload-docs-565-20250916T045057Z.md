# Align composed[].payload docs + add docs-lint (Fixes #565)

- Updated `docs/specs/README.md` to state `payload?: object | array | null` for the Composed Event envelope.
- Added `scripts/docs-lint.sh` to detect outdated mentions (`payload?: any` and similar).
- Added `.github/workflows/docs-lint.yml` for quick PR checks and push on `a5c/main`.
- Included "Docs Lint" in `.github/workflows/a5c.yml` `workflow_run` list for the a5c router.

Validation:

- Ran `./scripts/docs-lint.sh` locally — passed.
- Confirmed NE schema (`docs/specs/ne.schema.json`) constrains `composed[].payload` to `object | array | null`.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
