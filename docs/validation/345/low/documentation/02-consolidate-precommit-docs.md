# [Validator] [Documentation] Consolidate pre-commit docs

## Context

Pre-commit docs exist in multiple files: `docs/dev/precommit-hooks.md` and `docs/dev/developer-agent/precommit-hooks-303-*.md`. This creates duplication and potential drift.

## Recommendation

- Keep a single canonical doc under `docs/dev/precommit-hooks.md`.
- Update it with env flags, base ref for related tests, and troubleshooting.
- Convert the developer-agent scratch file into a short changelog note or link it from the canonical doc, then remove the duplicate.

## Acceptance Criteria

- One authoritative pre-commit doc with the latest instructions.
- No stale duplicates in `docs/dev/developer-agent/*` for this topic.
