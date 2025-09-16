## [Validator] Documentation — Mentions sources alignment note

Context: PR #619 updates CLI docs to remove `file_change` as a mentions source and clarifies that mentions found in diffs/changed files are emitted as `source: code_comment` with `location.file` and `location.line` set. This matches implementation in `src/types.ts` and scanning behavior in `src/enrich.ts` and tests.

Status: Non-blocking validation note. Specs main doc already reflects this behavior (see docs/specs/README.md §4.2). CLI reference is now consistent.

No further action required.
