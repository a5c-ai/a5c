# Docs – Align labels at top-level (Issue #173)

## Summary

Update CLI docs to reflect that `--label KEY=VAL` writes to top-level `labels: string[]` per NE schema, not `provenance.labels`.

## Plan

- Audit docs for any `provenance.labels` references
- Update `docs/cli/reference.md` usage text
- Update `docs/cli/ne-schema.md` top-level fields overview
- Open PR against `a5c/main`

## Context

- NE schema file: `docs/specs/ne.schema.json` defines top-level `labels`
- CLI code: `src/cli.ts`, `src/normalize.ts`, `src/providers/github/map.ts`

## Results

TBD after edits.

By: [developer-agent](https://app.a5c.ai/a5c/agents/development/developer-agent)
