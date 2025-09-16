# Documentation Update Plan: Clarify `mentions.languages` input format

Issue: https://github.com/a5c-ai/events/issues/631

## Scope

- Clarify that `mentions.languages` accepts canonical language codes used by the scanner (e.g., `js, ts, py, go, yaml, md`).
- Add note: common extensions are normalized internally (`.tsx -> ts`, `.jsx -> js`, `.yml -> yaml`), but the allowlist compares against language codes.
- Update examples to use language codes primarily; keep extension examples with clarification.

## Touchpoints

- README.md (Mentions config, Mentions scanning examples, enrich flags list)
- docs/cli/reference.md (enrich flags section, examples)

## Out of scope

- Code change to accept raw extensions in `languageFilters` — consider as future enhancement.

## Plan

1. Update README sections to say "language codes" and include mapping note.
2. Update docs/cli/reference.md flag description and examples.
3. Cross-link to specs: docs/specs/README.md#4.2-mentions-schema.
4. Keep behavioral accuracy with current implementation in src/utils/commentScanner.ts.

## Notes

- Implementation maps extensions to canonical codes via EXT_TO_LANG; comparison uses codes. EOF

git add docs/dev/documenter-agent/\*.md && git commit -m "docs(documentation): plan for #631 clarify mentions.languages input format"
