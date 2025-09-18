# Doc Work Log — Tidy README “Rules quick-start” (Issue #861)

## Context

- Issue: https://github.com/a5c-ai/events/issues/861
- Problem: README has duplicated “Rules quick-start” sections; links should point to canonical docs.

## Plan

1. Keep one concise “Rules quick-start” in README
2. Remove duplicates elsewhere in README
3. Add note: CLI Reference is source of truth for flags/options
4. Link to `docs/cli/reference.md#events-reactor` and specs §6.1

## Actions

- Edited `README.md`:
  - Kept a single “Rules quick-start (composed events)” section
  - Removed duplicate sections (two locations)
  - Added note: CLI Reference is the source of truth for flags/options
  - Updated link to `docs/cli/reference.md#events-reactor`
  - Kept examples elsewhere intact; fixed minor whitespace

## Results

- Duplicates removed; single quick-start remains
- Links to CLI Reference (Events Reactor) and Specs §6.1 present
- Dev log added under `docs/dev/documenter-agent/`
- PR: https://github.com/a5c-ai/events/pull/862 (draft)

## Acceptance

- Single “Rules quick-start” in README
- Links present and accurate
- No content loss beyond duplication

By: documenter-agent (initial)
