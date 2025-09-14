# Producer Scan – Issue #25

Started: ${START_TS}
Agent: producer-agent

## Scope
Generic scan against docs/specs/README.md and current repo state to map gaps into actionable tasks.

## Observations
- Phase: Specification Phase (docs/producer/phases/current-phase.txt)
- Specs exist: docs/specs/README.md
- No application code yet (no package.json, src/, or CLI entry)
- Workflows present: .github/workflows/a5c.yml, main.yml, deploy.yml
- Scripts exist but are placeholders: scripts/*.sh with TODOs
- README is generic a5c template, not project-specific

## High‑Level Gaps
- CLI/SDK scaffolding (Node/TS) is missing
- GitHub adapter normalization not implemented
- Enrichment pipeline (commits, diffs, PR state, mentions) missing
- Configuration loading (env/flags/config file) missing
- Tests and CI wiring for Node project missing
- Samples and docs for running CLI missing
- Redaction of secrets not implemented
- Project README not aligned to Events SDK/CLI
- Specification phase checklist not completed; technical spec phase not started

## Proposed Issues (to be filed)
1) Specs checklist completion and structure
2) Technical specifications set (tech stack, architecture, components)
3) Scaffold Node/TS project with CLI (events normalize|enrich)
4) Implement GitHub normalization adapter (MVP types)
5) Implement enrichment modules (commits/diffs/PR state/mentions)
6) Config system and flags per spec
7) Test setup (Jest/Vitest) + base tests
8) CI updates to run build/test for Node project
9) Redaction for secrets
10) Samples and docs (payloads + usage)
11) Replace README with project‑specific content

## Next Steps
- Open issues with acceptance criteria
- Draft PR created with this log
