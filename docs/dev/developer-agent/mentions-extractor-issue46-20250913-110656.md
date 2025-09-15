# Mentions Extractor – Issue #46

## Goal

Implement mentions extraction across commit messages, PR/issue titles/bodies, issue comments, and code comments with configurable sources and file/language filters. Provide CLI and unit tests.

## Plan

- Scaffold Node.js + TypeScript + Jest
- Core extractor with regex + comment patterns
- CLI with flags to toggle sources and limits
- Fixtures for commits and PR bodies
- Tests: commit message + PR body
- Wire scripts and docs notes

## Notes

Initial pass favors regex and simple language comment parsing. Future: AST for JS/TS, Python.

## Implementation Progress

- Added core extractor with regex and normalization
- CLI subcommand `events mentions`
- Unit tests for commit message and PR body
- Vitest config and scripts updated

## Next Steps

- Implement scanning for issue comments and code comments
- Add config toggles per source + file size cap + language filters
- Provide fixtures for commits and PR bodies (samples directory)
