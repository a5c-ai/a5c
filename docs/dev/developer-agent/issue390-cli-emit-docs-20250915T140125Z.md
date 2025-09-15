# Issue #390 – Add CLI 'events emit' docs

Started: 20250915T140125Z

## Plan

- Add `events emit` section under CLI Reference with usage, options, examples.
- Cross-link redaction behavior (`src/utils/redact.ts`).
- Open PR linked to #390.

## Context

- Handler: `src/emit.ts` (redacts then writes to stdout/file).
- Wired in CLI: `src/cli.ts`.
- Reference file: `docs/cli/reference.md`.

## Notes

- `--sink`: stdout (default) or file.
- `--out` required when sink=file; error otherwise.
