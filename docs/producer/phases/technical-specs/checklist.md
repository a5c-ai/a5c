# Technical Specs Phase – Checklist

This checklist tracks readiness to exit the Technical Specifications phase. When all items are complete, update `docs/producer/phases/current-phase.txt` to the next phase.

See also:
- Specs overview: docs/specs/tech-specs.md
- Specs index: docs/specs/README.md
- Phase index: docs/producer/phases/technical-specs/README.md
- Tech stack: docs/producer/phases/technical-specs/tech-stack.md
- System architecture: docs/producer/phases/technical-specs/system-architecture.md
- CLI reference: docs/cli/reference.md
- NE schema: docs/specs/ne.schema.json

## Status Legend
- [x] Complete
- [ ] Pending / In progress

## Readiness Items

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
- [ ] Phase transition criteria documented and acknowledged by producer
  - Action: Producer to confirm and flip `current-phase.txt` upon completion

## Notes
- Enrichment bounds can be tuned via flags: `--flag commit_limit=50 --flag file_limit=200 --flag include_patch=true`.
- Token precedence and redaction are documented: see docs/cli/reference.md and src/utils/redact.ts.
