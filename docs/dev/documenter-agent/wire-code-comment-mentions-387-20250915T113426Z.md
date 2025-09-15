# Dev Log: Wire code-comment mentions in enrich (Issue #387)

- Branch: docs/code-comment-mentions-docs-387
- Context: Per specs §4.2, mentions should include code comments from changed files with location data. Implementation exists across src/enrich.ts and src/utils/commentScanner.ts. Docs need to reflect flags and usage.

## Plan

1. Update docs/cli/reference.md: add , , , and example invocations for patches vs file fetch.
2. Update docs/specs/README.md §4.2 Mentions: list configuration knobs and defaults.
3. Add a new page docs/cli/code-comment-mentions.md: quickstart + examples for PR and push events, including and interplay.
4. Ensure acceptance criteria examples show with and .

## Notes

- include_patch default is false (security/size). Examples will set it explicitly when demonstrating patch scanning.
- When include_patch=false, code-comment scanning still can occur via raw file fetch path if plus token and flags allow.
- Language filters default to file extension mapping; provides allowlist.
