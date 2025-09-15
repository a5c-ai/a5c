# Issue 383: Align Node versions across workflows + add .nvmrc

## Context

- Mixed Node versions in workflows (20 and 22)
- package.json engines: ">=20"
- No .nvmrc at root

## Decision

- Canonical Node version: 20 (LTS), consistent with engines
- Use `actions/setup-node@v4` with `node-version-file: .nvmrc` where possible for single source of truth
- Keep matrix builds (e.g., typecheck) if they intentionally test multiple versions; default other jobs to 20

## Plan

1. Add `.nvmrc` with `20`
2. Update workflows to reference `.nvmrc` (or `node-version: 20` where `node-version-file` not suitable)
3. Update docs (README, CONTRIBUTING, docs/ci/ci-checks.md) to state Node 20 policy
4. Validate workflows syntax

## Notes

- If team prefers Node 22, flip `.nvmrc` and a single replace in workflows; engines range still satisfied.
