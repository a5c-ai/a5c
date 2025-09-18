# README Overhaul for @a5c-ai/events

Issue: https://github.com/a5c-ai/events/issues/938

## Goal

Rewrite README to reflect the current implementation, name, purpose, and scope. Ensure clarity for both CLI and SDK, align with NE schema and recent features (generate_context, enrichment flags, ownership semantics, token behavior), and streamline Quick Start.

## Plan

- Audit current README vs. docs/cli/reference.md and package.json
- Re-structure sections: Purpose, Scope, Install, Quick Start, CLI Overview, SDK, CI, Schema, Config, Development, Links
- Clarify branch roles (a5c/main vs main) and CI checks summary
- Remove outdated/duplicated fragments; link to canonical docs to avoid drift
- Add concise examples for new commands (generate_context) and token/env behavior
- Validate links and commands; keep README ≤ ~200 lines for scannability

## Notes

- Keep Mentions flags canonical in docs/cli/reference.md; README links to it
- Preserve badges and repo identity
- Ensure examples use repository samples where possible

## Progress

- Created working branch and this progress log
- Next: Implement README rewrite

## Results

- README rewritten and merged via PR #939
- Linked to issue #938 (closed)
