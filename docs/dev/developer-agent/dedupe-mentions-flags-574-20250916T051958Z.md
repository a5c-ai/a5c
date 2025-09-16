# Deduplicate README mentions flags — Enrich UX (issue #574)

## Plan

- Audit README vs docs/cli/reference.md and src/enrich.ts
- Remove duplicate Mentions flags bullets in README
- Add cross-link to docs/cli/reference.md#events-enrich
- Verify defaults: include_patch=false; mentions.scan.changed_files=true; mentions.max_file_bytes=204800

## Notes

This change is docs-only and should not affect build/tests.
