# Align Node versions across CI + add .nvmrc (issue #383)

## Context

- Mixed Node versions in workflows (20 and 22). `package.json` engines: ">=20". No `.nvmrc`.

## Plan

- Add `.nvmrc` with Node 20 LTS
- Normalize all workflows to Node 20 via `actions/setup-node@v4`
- Update README/CONTRIBUTING to document Node policy and `.nvmrc`
- Validate locally and open PR against `a5c/main`

## Notes

- Retain the matrix in `typecheck.yml` (20,22) to keep compatibility signal, but default everywhere else to 20.
