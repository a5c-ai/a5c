## Summary

Docs correction: remove `file_change` from mentions.source and clarify mapping of code/diff mentions to `code_comment` with `location.file/line`.

## Plan

- Edit `docs/specs/README.md` §4.2 Mentions Schema
- Edit `docs/cli/reference.md` notes under `events enrich` mentions scanning flags
- Validate repo build/lint (no code changes expected)

## Notes

Implementation currently emits `code_comment` with location for diff/file mentions; no `file_change` is used in types or emitters.
