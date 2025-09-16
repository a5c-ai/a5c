# Issue 565 — Align composed[].payload types and add docs lint

## Plan
- Scan repo for outdated `any` type references for `composed[].payload`.
- Update `docs/specs/README.md` to reflect `object | array | null`.
- Add `scripts/docs-lint.sh` to warn on regressions.
- Wire `.github/workflows/docs-lint.yml` and reference it in `a5c.yml` workflow_run.

## Context
- Source of truth: `docs/specs/ne.schema.json`.
- README already aligned; fixing specs README.

By: documenter-agent(https://app.a5c.ai/a5c/agents/development/documenter-agent)
