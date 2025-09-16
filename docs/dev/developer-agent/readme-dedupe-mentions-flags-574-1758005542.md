# Work Log: Deduplicate README mentions flags — Enrich UX (issue #574)

## Plan

- Verify defaults in src/enrich.ts and docs/cli/reference.md
- Patch README.md to keep a single canonical Mentions flags list under `events enrich`
- Add a cross-link to docs/cli/reference.md#events-enrich
- Build and run quick lint/typecheck

## Notes

- include_patch default is false
- mentions.max_file_bytes default is 204800 (200KB)
- mentions.scan.changed_files default is true
- mentions.languages is optional
