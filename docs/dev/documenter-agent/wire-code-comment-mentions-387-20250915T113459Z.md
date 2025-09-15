# Dev Log: Wire code-comment mentions in enrich (Issue #387)

- Branch: docs/code-comment-mentions-docs-387
- Context: Per specs §4.2, mentions should include code comments from changed files with location data. Implementation exists across `src/enrich.ts` and `src/utils/commentScanner.ts`. Docs need to reflect flags and usage.

## Plan

1. Update `docs/cli/reference.md`: add `mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages`, and example invocations for patches vs. file fetch.
2. Update `docs/specs/README.md` §4.2 Mentions: verify configuration knobs and defaults are present; add an example output snippet if missing.
3. Add a new page `docs/cli/code-comment-mentions.md`: quickstart + examples for PR and push events, including `--flag include_patch` and `--use-github` interplay.
4. Ensure acceptance criteria examples show `source=code_comment` with `location.file` and `location.line`.

## Notes

- `include_patch` default is false (security/size). Examples will set it explicitly when demonstrating patch scanning.
- When `include_patch=false`, code-comment scanning can still occur via raw file fetch path if `--use-github` plus token and flags allow.
- Language filters default to file extension mapping; `mentions.languages` provides an allowlist.
