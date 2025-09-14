# Technical Specs Phase – Checklist

Use this list to gate readiness to exit the Specification Phase and enter implementation hardening. Check items only when the linked artifact exists and aligns with the current code.

## Core Decisions
- [x] Tech stack locked (TypeScript, Node >=18, ESM) — see docs/producer/phases/technical-specs/tech-stack.md
- [x] CLI framework chosen (`yargs`), binary name `events` — see docs/specs/tech-specs.md#stack

## Schema & Validation
- [x] NE schema committed at docs/specs/ne.schema.json
- [x] Ajv validation in tests; formats enabled (date-time) — see tests/ne.schema.compile.test.ts and docs/validation/83/high/tests/01-ajv-formats-date-time.md

## Provider Adapters
- [x] GitHub adapter mapping scaffolded — see docs/producer/phases/technical-specs/system-components/providers.md and src/providers/github/map.ts
- [ ] GitHub enrichment coverage defined (owners, conflicts, repo metadata) — see docs/specs/README.md#enrichment

## Enrichment Bounds
- [x] Commit/file bounds defined in docs (paginate/paginate) — see docs/producer/phases/technical-specs/data-models/enrichment-types.md
- [ ] Default limits codified in code and docs (max commits/files per PR)

## CLI Parity
- [x] Commands defined in specs (normalize, enrich, emit) — see docs/producer/phases/technical-specs/apis/cli-commands.md
- [x] CLI implemented for normalize/enrich — see src/normalize.ts, src/enrich.ts, docs/cli/reference.md
- [ ] Emit/sinks documented and stubbed (stdout/file, artifacts)

## CI & Quality
- [x] CI workflows present (build, tests) and green on a5c/main — see .github/workflows
- [ ] Lint and coverage thresholds documented; workflows include lint

## Release & Publishing
- [x] Release workflow scaffolded for a5c/main push — see docs/producer/phases/technical-specs/deployment/publishing.md
- [ ] Package metadata ready (name, access, registry) and semantic-release/changesets configured

## Cross-links
- [x] Specs index references technical-specs directory — see docs/specs/README.md
- [x] This checklist cross-links to docs/specs/tech-specs.md

---
References: docs/specs/tech-specs.md, docs/specs/README.md
