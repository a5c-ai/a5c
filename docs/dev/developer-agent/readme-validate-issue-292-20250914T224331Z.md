# Docs: Fix README conflict and add `events validate` examples (Issue #292)

## Context

README shows a merge conflict over whether to include `events validate`. CLI includes a `validate` subcommand with `--quiet` and `--schema` defaulting to `docs/specs/ne.schema.json`.

## Plan

- Resolve README conflict to include `validate` in command list
- Add quiet example and link to schema path
- Verify `events validate` works against sample output

## Notes (start)

- CLI source: `src/cli.ts` defines `validate` with Ajv and minimal date-time format handling.
- Samples available under `samples/`.
