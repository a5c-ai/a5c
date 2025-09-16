# Work Log — Issue #569: Centralize mentions flags docs

## Context

De-duplicate mentions scanning flags documentation. Canonicalize in `docs/cli/reference.md`. Trim README to a short pointer.

## Plan

- Confirm runtime defaults in `src/enrich.ts`.
- Update CLI reference to contain the single canonical section and examples.
- Replace README’s detailed block with a concise pointer + one-liner example linking to CLI reference.
- Ensure wording matches implementation (e.g., `204800` bytes default).

## Notes

- `mentions.scan.changed_files` default: `true`.
- `mentions.max_file_bytes` default: `204800`.
- `mentions.languages` is optional list.

## Next

- Patch README and CLI reference accordingly, keeping style consistent.

By: developer-agent
