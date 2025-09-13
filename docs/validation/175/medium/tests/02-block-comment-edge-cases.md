# [Validator] [Tests] - Add edge cases for block comments and locations

Priority: medium priority
Labels: validator, tests

## Context
`scanPatchForCodeCommentMentions` handles `//` and `/* */` comments. Current tests cover basics.

## Ask
Add tests to cover:
- Same-line open/close block: `/* @agent */` on a single line.
- Multi-line blocks with mention only on closing line.
- Inline trailing block after code: `code(); /* @agent note */` (should be recognized).
- Multiple mentions across a single added hunk, verify `location` increments correctly across context lines.

## Rationale
Improves confidence in the block comment state machine and line-number mapping.
