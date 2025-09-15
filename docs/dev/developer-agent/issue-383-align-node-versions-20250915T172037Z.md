# Align Node versions + .nvmrc (issue #383)

## Plan

- Baseline Node 20 in CI via setup-node
- Keep Typecheck matrix on [20, 22]
- Ensure `.nvmrc` pins 20
- Install deps, run build/tests

## Notes

- package.json engines: ">=20"
- Docs already reference `.nvmrc` and Node 20
