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
