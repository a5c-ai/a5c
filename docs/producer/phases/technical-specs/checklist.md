# Technical Specs Phase – Checklist

Use this list to gate readiness to exit the Specification Phase. Check items only when the linked artifact exists and aligns with current code.

1) Core stack locked
- [x] TypeScript, Node >= 18, ESM — see [Tech Stack](./tech-stack.md)

2) CLI decisions
- [x] Framework `yargs`, binary `events` — see [Technical Specs – Stack](../../../specs/tech-specs.md#stack)

3) NE schema and validation
- [x] NE schema at [docs/specs/ne.schema.json](../../../specs/ne.schema.json)
- [x] Ajv compile + formats (date-time) in tests — [tests/ne.schema.compile.test.ts](../../../../tests/ne.schema.compile.test.ts), [Ajv formats note](../../../validation/83/high/tests/01-ajv-formats-date-time.md)

4) Provider adapter (GitHub MVP)
- [x] Mapping scaffolded — [Providers](./system-components/providers.md), [src/providers/github/map.ts](../../../../src/providers/github/map.ts)
- [ ] Enrichment coverage outlined (owners, conflicts, repo metadata) — [Specs – Enrichment Taxonomy](../../../specs/README.md#4-enrichment-taxonomy)

5) Enrichment bounds
- [x] Commit/file bounds described — [Enrichment Types](./data-models/enrichment-types.md)
- [ ] Default limits specified in code/docs (max commits/files per PR)

6) CLI parity with specs
- [x] Commands defined in specs (normalize, enrich, emit) — [CLI Commands](./apis/cli-commands.md)
- [x] Normalize/enrich implemented — [src/normalize.ts](../../../../src/normalize.ts), [src/enrich.ts](../../../../src/enrich.ts), [CLI Reference](../../../cli/reference.md)
- [ ] Emit/sinks documented and stubbed (stdout/file, artifacts)

7) CI status
- [ ] CI (build, tests, lint) green on `a5c/main` — see [.github/workflows](../../../../.github/workflows)

8) Release & publishing
- [x] Release workflow scaffolded for `a5c/main` pushes — [Publishing](./deployment/publishing.md)
- [ ] Package metadata and release tooling (semantic-release/Changesets) verified

9) Cross-links
- [x] Specs index references this directory — [Specs README](../../../specs/README.md)
- [x] Checklist cross-links to [docs/specs/tech-specs.md](../../../specs/tech-specs.md)

When all items are checked, update `docs/producer/phases/current-phase.txt` to the next phase.
