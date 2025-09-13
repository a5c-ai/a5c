# Technical Specs Phase – Checklist

This checklist tracks readiness to exit the Technical Specifications phase and proceed into scaffolding/development. When all required items are complete, update `docs/producer/phases/current-phase.txt` to the next phase.

See also:
- Specs overview: docs/specs/tech-specs.md
- Phase index: docs/producer/phases/technical-specs/README.md
- CLI reference: docs/cli/reference.md
- NE schema: docs/specs/ne.schema.json

## Status Legend
- [x] Complete
- [ ] Pending / In progress

## Structure & Indexing
- [x] Tech Specs index present (`README.md`) with navigation
- [x] Core sections scaffolded (Tech Stack, System Architecture, Components, APIs, Data Models, Events, Integrations, Testing, Deployment)

## Core Content
- [x] Tech Stack drafted (`tech-stack.md`)
- [x] System Architecture drafted (`system-architecture.md`)
- [x] Components outlined (`system-components/*` including CLI, Core, Providers, Enrichers, Storage)
- [x] APIs outlined (`apis/*` including CLI Commands, Node API, Plugin API)
- [x] Data Models drafted (`data-models/*` including Normalized Event and Enrichment Types)
- [x] Events detailed (`events/*` including Input Mapping, Output Contracts)
- [x] Integrations drafted (`integrations/*` including GitHub Actions, Webhooks, MCP)
- [x] Testing strategy drafted (`testing/strategy.md`)
- [x] Deployment notes drafted (`deployment/publishing.md`)

## Implementation Readiness

- [x] Tech stack decisions locked (Node 20+, TypeScript, ESM, commander CLI, Vitest, ESLint, Prettier)
  - Source: docs/producer/phases/technical-specs/tech-stack.md, package.json
- [x] NE schema validation strategy defined (Ajv + ajv-formats) and compiled in tests
  - Source: docs/specs/ne.schema.json, tests/ne.schema.compile.test.ts
- [x] Provider adapters MVP: GitHub normalization implemented
  - Source: src/providers/github/map.ts, src/normalize.ts, tests/normalize.*
- [x] Enrichment implementation with bounds (commit/file limits, include_patch flag)
  - Source: src/enrich.ts (commit_limit,file_limit,include_patch), src/enrichGithubEvent.js
- [x] Mentions extractor implemented with CLI command
  - Source: src/cli.ts (mentions), src/extractor.ts, tests/mentions.*
- [x] CLI commands parity with specs (mentions, normalize, enrich)
  - Source: docs/cli/reference.md, docs/specs/tech-specs.md, src/cli.ts
- [x] CI green on a5c/main (build, test, lint)
  - Source: .github/workflows/*.yml, recent runs show success on a5c/main
- [x] Release and publishing workflows ready (semantic-release, GitHub Packages)
  - Source: .github/workflows/release.yml, package.json publishConfig
- [x] Packages NPX smoke runs in CI for published package
  - Source: .github/workflows/packages-npx-test.yml
- [x] Docs cross-linked and organized (specs, CLI, phase docs)
  - Source: docs/specs/README.md, docs/cli/reference.md, phase tech-specs README

## Quality & Cross-Cutting
- [ ] Constraints and non-functionals captured (performance, security, compatibility)
- [ ] Token/secret handling and redaction covered (link to CLI docs or spec)
- [ ] Backwards compatibility/versioning approach stated (NE schema)
- [ ] Open questions, assumptions, risks documented
- [ ] Traceability to issues and tasks (links from docs to issues/PRs)

## Handoff Readiness
- [ ] Minimal scaffolding plan outlined (packages, directories, entry points)
- [ ] Initial tasks for development created and linked
- [ ] Acceptance tests/E2E stories identified for MVP
- [ ] Phase transition criteria documented and acknowledged by producer
  - Action: Producer to confirm and flip `current-phase.txt` upon completion

## Notes
- Enrichment bounds can be tuned via flags: `--flag commit_limit=50 --flag file_limit=200 --flag include_patch=true`.
- Token precedence and redaction are documented: see docs/cli/reference.md and src/utils/redact.ts.
- Pre-checked items are based on current docs present in this repository as of this PR.
