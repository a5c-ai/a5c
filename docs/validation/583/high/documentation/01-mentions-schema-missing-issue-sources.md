# [Validator] [Documentation] Mentions schema omits issue_title/issue_body sources

## Context

PR #583 corrects docs by removing `file_change` from `mentions.source` and clarifying that mentions in diffs/changed files are emitted as `source: code_comment`.

Implementation defines additional mention sources not currently documented in specs:

- `issue_title`
- `issue_body`

References:

- src/types.ts — `export type MentionSource = ... | "issue_body" | "issue_title" | ...`

## Impact

- Incomplete documentation can mislead integrators expecting `issue_*` mentions.

## Recommendation

- Update `docs/specs/README.md` §4.2 Mentions Schema to include `issue_title` and `issue_body` in the allowed `source` values list.
- Optionally add brief examples for all sources.

## Priority

High (non-blocking for this PR)
