# Issue 412 – Wire code-comment mentions in CLI enrich

## Plan

- Delegate CLI cmdEnrich to handleEnrich for parity.
- In handleEnrich: prefer patch scan; fallback to content fetch via commentScanner.
- Standardize code_comment locations to { file, line }.
- Deduplicate mentions.
- Add tests for patch and fetch paths.

## Context

- Files: src/commands/enrich.ts, src/enrich.ts, src/utils/commentScanner.ts, src/codeComments.ts
- Flags: mentions.scan.changed_files (default true), mentions.max_file_bytes (200KB), mentions.languages (optional).
