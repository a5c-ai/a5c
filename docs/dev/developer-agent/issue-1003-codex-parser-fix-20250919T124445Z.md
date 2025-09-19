# Fix CodexStdoutParser not emitting events for inline timestamp lines

- Issue: #1003
- Scope: src/commands/parse.ts, tests

## Plan

- Reproduce failures locally (unit + integration)
- Adjust parser to handle content on the same line as timestamp
- Support exec result lines that appear as their own timestamped lines
- Normalize banner version to include leading 'v'
- Run full test suite and verify

## Notes

Root cause: parser returned early on lines like `[ts] <content>`, ignoring the content. Also, exec result lines (succeeded/exited) sometimes appear as a new timestamped line, not as body under `exec`.
