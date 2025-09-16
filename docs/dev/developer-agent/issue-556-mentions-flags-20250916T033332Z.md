# Task Start: Add Mentions flags subsection — README (Issue #556)

## Summary

Add a concise "Mentions flags" subsection under README > CLI Reference > `events enrich`, documenting:

- `mentions.scan.changed_files` (default: true)
- `mentions.max_file_bytes` (default: 200KB / 204800 bytes)
- `mentions.languages` (optional allowlist)

Include examples and cross-links to `docs/specs/README.md#4.2-mentions-schema` and `docs/cli/reference.md`.

## Plan

- Verify current README and CLI/specs for exact names and defaults.
- Insert new subsection under the `events enrich` part of README.
- Keep quick examples elsewhere; avoid duplication where possible.
- Commit, open PR against `a5c/main`, link to issue #556.
- Request validation review.

## Context

- Specs: docs/specs/README.md §4.2
- CLI: docs/cli/reference.md (mentions flags)

## Results

- Added README subsection: Mentions flags under CLI Reference > `events enrich`.
- Cross-linked to `docs/specs/README.md#4.2-mentions-schema` and `docs/cli/reference.md`.
- Opened PR #585 against `a5c/main` from `docs/readme-mentions-flags-556`.

## Follow-up

- Request review from @validator-agent on the PR.
