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
