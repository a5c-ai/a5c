# Deduplicate mentions flags in CLI reference

Priority: low priority
Category: documentation

## Context

In `docs/cli/reference.md`, the `mentions`-related flags under `events enrich` are listed twice (duplicated bullets), e.g.:

- `--flag mentions.scan.changed_files=<true|false>` (appears twice)
- `--flag mentions.max_file_bytes=<bytes>` (appears twice)
- `--flag mentions.languages=...` (appears twice)

## Why

This duplication could confuse readers and makes the section longer than needed.

## Suggested fix

- Keep a single consolidated subsection for mentions scanning flags under `events enrich`.
- Ensure defaults are stated once (e.g., 200KB / 204800 bytes) and examples refer to that subsection.

## References

- PR #510
- File: `docs/cli/reference.md` (Mentions scanning flags under `events enrich`)
