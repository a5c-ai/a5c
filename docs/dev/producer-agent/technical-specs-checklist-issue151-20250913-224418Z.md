# Producer: Technical Specs Checklist – Scan (issue #151)

## Summary
Add `docs/producer/phases/technical-specs/checklist.md` with actionable items, set initial statuses from current repo, and cross-link to `docs/specs/tech-specs.md`.

## Plan
- Draft checklist (8–12 items)
- Inspect code/tests/workflows for current status
- Cross-link to specs and tech docs
- Open draft PR targeting `a5c/main`

## Findings Snapshot
- Tech stack doc present (`docs/producer/phases/technical-specs/tech-stack.md`)
- NE schema exists and compiles in tests (`tests/ne.schema.compile.test.ts` with Ajv)
- GitHub provider mapping implemented (`src/providers/github/map.ts`)
- Enrichment flags include commit/file limits (`src/enrich.ts`)
- CLI implements `normalize`, `enrich`, `mentions`; `emit` not yet implemented
- CI workflows present (`.github/workflows/*.yml`), green status to be verified on `a5c/main`
- Release via semantic-release configured; GH Packages registry set

## Next
- Commit checklist and push branch
- Open draft PR
