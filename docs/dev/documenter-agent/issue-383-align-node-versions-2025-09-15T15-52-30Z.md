# Issue 383: Align Node versions across workflows + add .nvmrc

## Context

- engines in package.json: ">=20"
- Mixed workflows use Node 20 and 22.

## Plan

1. Add `.nvmrc` with `20`
2. Update all workflows to Node 20
3. Update README and CONTRIBUTING with version policy
4. Open PR, link to issue, request validation

## Notes

- Choosing Node 20 LTS as canonical for CI and local dev.

## Changes

- Ensure `.nvmrc` present with `20`
- Align workflows to Node 20 where applicable
  - .github/workflows/main.yml: `matrix.node-version` from `[22]` → `[20]`
  - Keep Typecheck matrix on `[20, 22]` for compatibility only
- README and CONTRIBUTING already documented Node 20 policy; confirmed and left as-is

## Validation

- Local install and build succeeded
- Pre-push tests passed prior to opening PR
