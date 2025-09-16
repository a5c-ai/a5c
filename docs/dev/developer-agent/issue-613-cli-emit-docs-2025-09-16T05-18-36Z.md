# Issue 613 – CLI `emit` docs

## Context

Document `events emit` command: purpose, options, defaults, and examples. Cross-link from README.

## Plan

- Confirm flags and behavior (`src/cli.ts`, `src/emit.ts`)
- Update `docs/cli/reference.md` Emit section
- Add README cross-link

## Notes

- `--sink` defaults to `stdout`; if `--sink file`, require `--out`.
- Redaction applied before emission.
