# Dev Log — Issue #293: Document mentions scanning flags — Enrich UX

## Context

Specs mention mentions scanning configuration (`mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages`) but CLI docs lack `--flag` examples. Implementation found in `src/enrich.ts`.

## Plan

- Update `docs/cli/reference.md` with a Mentions Flags subsection under `events enrich`.
- Add examples:
  - `--flag mentions.scan.changed_files=false`
  - `--flag mentions.languages=js,ts,md`
  - `--flag mentions.max_file_bytes=102400`
- Cross-link to `docs/specs/README.md` §4.2.
