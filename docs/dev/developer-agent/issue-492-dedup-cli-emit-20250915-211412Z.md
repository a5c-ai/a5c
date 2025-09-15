# Task: Deduplicate `events emit` section in CLI Reference

- Issue: https://github.com/a5c-ai/events/issues/492
- Branch: a5c/main -> docs/fix-dedup-cli-emit-492

## Plan

- Confirm duplicate headings and choose canonical block (keep first).
- Remove duplicate block while preserving anchor `#events-emit`.
- Ensure surrounding sections (`enrich`, `validate`) remain intact.
- Search for inbound links to `#events-emit` (none found in repo; still ensure anchor remains).

## Notes

- Duplicates observed at headings around lines ~146 and ~183 in `docs/cli/reference.md` on `a5c/main`.
