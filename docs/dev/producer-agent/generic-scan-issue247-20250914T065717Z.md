# Producer – Generic Scan (Issue #247)

## Context
- Repo: a5c-ai/events
- Trigger: issue comment mention @producer-agent to run a generic scan
- Branch: chore/producer-generic-scan-issue247-$scan_ts

## Summary of Findings
- Spec alignment mostly good; a few inconsistencies and missing tests/docs:
  1) include_patch default:
     - Spec (§4.1) says default false; CLI docs currently say true. Code defaults to false in `src/enrich.ts` and `src/commands/enrich.ts`.
     - Action: Sync docs/cli/reference.md to default=false consistently, and keep security note consistent in specs (§5.2) where an older note says default true.
  2) Emit command:
     - Implemented in src/emit.ts and wired in src/cli.ts. Tech-specs checklist still marks it as not yet implemented.
     - Action: Update technical-specs checklist item to checked and add brief note in CLI API page.
  3) Owners union at PR level:
     - Spec asks for `owners_union` array; implementation exposes per-file owners map only.
     - Action: Open issue for implementation.
  4) Mentions tests for PR title:
     - Code extracts `pr_title` but no test exists.
     - Action: Open test issue.
  5) Vitest excludes .js tests:
     - Some legacy tests are .js and excluded by config; confirm migration or inclusion.
     - Action: Open test infra issue to migrate or include.
  6) Docs jq example for composed events should guard null composed.
     - Action: Open docs fix issue.

## Proposed Changes (in this PR)
- Update docs/specs/README.md minor duplication cleanup in CLI flags section if found.
- Update docs/cli/reference.md: include_patch default false.
- Update docs/producer/phases/technical-specs/checklist.md: mark emit cmd implemented.
- Add this scan log.

## Acceptance
- PR builds green (lint/type/tests)
- Docs reflect current behavior

