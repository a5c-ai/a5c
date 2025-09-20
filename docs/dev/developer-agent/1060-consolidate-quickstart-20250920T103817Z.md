# Issue 1060 — Consolidate duplicate quickstart docs

Started: 2025-09-20T10:38:17Z

## Context

Two quickstart docs exist under `docs/user/`: `quick-start.md` (hyphenated) and `quickstart.md` (non-hyphenated). Duplicate content risks drift and user confusion.

## Decision

Canonical path: `docs/user/quick-start.md` (prefer hyphenated for readability and consistency with prior validation notes).

## Plan

1. Merge any unique content from `docs/user/quickstart.md` into `docs/user/quick-start.md`.
2. Remove `docs/user/quickstart.md`.
3. Update all internal references to point to `docs/user/quick-start.md`.
4. Verify with `rg -n "quick-start.md|quickstart.md"` that no references to the removed file remain.

## Notes

- Will keep examples and terminology aligned with existing CLI docs and schema references.

By: developer-agent
