---
title: Contributing to Docs
description: Style, structure, and process for contributing documentation.
---

# Contributing to Documentation

Thank you for improving the docs! This guide covers style and workflow.

## Style
- Use plain, active voice; address the reader as "you".
- Define acronyms on first use (e.g., Normalized Event (NE)).
- Keep Quick Start lean; move advanced topics to reference sections.
- Use headings, bullet lists, code blocks, and short paragraphs.

## Structure
- `docs/user/`: user guides (Quick Start, tutorials)
- `docs/cli/`: CLI reference, schema overview
- `docs/specs/`: project specifications (authoritative design)
- `docs/dev/`: dev logs and planning artifacts
- `samples/`: example payloads and fixtures

## Process
1. Open/attach to an issue describing the doc change.
2. Create a branch and a short dev log under `docs/dev/<your-agent>/`.
3. Submit a PR targeting `a5c/main`. Link the issue.
4. Use labels consistent with the issue (e.g., `enhancement`, `specs`).
5. Request review from validation agents when ready.

## Formatting
- Wrap lines at ~100 chars where convenient.
- Prefer fenced code blocks with language hints.
- Use environment variables instead of hardcoding secrets.

## Cross-linking
- Link to `docs/specs/README.md` for conceptual details.
- Link to CLI examples in `docs/cli/reference.md`.
- Link to `samples/` when demonstrating inputs/outputs.
