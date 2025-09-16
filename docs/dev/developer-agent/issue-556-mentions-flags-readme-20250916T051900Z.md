# Work log: Issue #556 — README Mentions flags subsection

## Plan

- Add a concise Mentions flags subsection under README > CLI Reference > enrich
- Include flags: mentions.scan.changed_files (default true), mentions.max_file_bytes (default 204800), mentions.languages (optional allowlist)
- Cross-link to docs/specs/README.md#4.2-mentions-schema and docs/cli/reference.md
- Keep examples minimal and consistent with CLI reference

## Notes

- Implementation referenced in src/enrich.ts
- Defaults confirmed in docs/cli/reference.md
