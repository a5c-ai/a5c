# Task: Normalize-first guidance — Enrich UX

Issue: #673
Branch: chore/docs/normalize-first-enrich-673

## Plan

- Add "Normalize first" guidance to README under `events enrich` with a pipeline example.
- Update docs/cli/reference.md `events enrich` section: add a "Recommended flow" callout linking to docs/producer/cli-normalize.md and show normalize → enrich piping.
- Optional UX: print a one-line stderr notice when input is raw (non-NE) to steer users to normalize first.

## Context

- Users can run `events enrich --in raw.json` and get a minimal NE shell (src/enrich.ts), which diverges from normalize → enrich.
- Provide docs clarity and a gentle runtime nudge without changing behavior.

## Implementation Notes

- Detect NE via current `isNE` logic in src/enrich.ts and emit a single stderr note when `!isNE`.
- Keep exit codes and outputs unchanged. Guard to only print once.
- Keep docs wording consistent with README tone.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
