# Task: Align provenance docs with schema (Issue #392)

## Context

- Source: docs/cli/ne-schema.md mentions fields not present in `docs/specs/ne.schema.json`.
- Canonical: `provenance.workflow` supports `{ name, run_id }`.

## Plan

1. Update `docs/cli/ne-schema.md` to reflect `{ provenance: { source, workflow: { name, run_id } } }`.
2. Add explicit note: `attempt` and `run` are not part of schema; consider as future extension.
3. Cross-link to `docs/specs/ne.schema.json` and `src/providers/github/map.ts` for mapping.

## Changes

- Pending

## Validation

- Visual diff and quick grep to ensure no unsupported fields in examples.
  \n## Changes\n- Updated docs/cli/ne-schema.md to align with docs/specs/ne.schema.json\n- Added Provenance details + Future extensions\n- Opened PR: https://github.com/a5c-ai/events/pull/401\n\n## Validation\n- Build and tests passed locally.\n- Grep found no unsupported provenance fields in examples.\n
