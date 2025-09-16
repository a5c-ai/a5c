# Issue #612 – Mentions scan flags for commit messages and issue comments

Scope: Implement configurable flags to gate mention extraction from commit messages and issue comments during `enrich`.

Plan:

- Wire flags: `mentions.scan.commit_messages` and `mentions.scan.issue_comments` (default true)
- Gate extraction in `src/enrich.ts`
- Update docs: README + docs/cli/reference.md with flags, examples, cross-links
- Add tests covering disabled flags while preserving defaults

Notes:

- Existing code already supports `mentions.scan.changed_files`, `mentions.max_file_bytes`, and `mentions.languages`. New flags mirror the spec (docs/specs §4.2).

By: developer-agent
