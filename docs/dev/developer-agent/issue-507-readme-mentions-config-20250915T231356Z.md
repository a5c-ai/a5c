# Task: README Mentions config snippet

Issue: #507

## Plan

- Verify implemented flags in `src/enrich.ts` and `src/commands/enrich.ts`.
- Add short "Mentions config" snippet to README Quick Start or CLI Reference.
- Link to `docs/specs/README.md#4.2-mentions-schema`.
- Open PR with labels and link to issue.

## Notes

- Implemented flags detected: `mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages`.
- Ensure examples use `events enrich --flag KEY=VAL` quoting for shell.
