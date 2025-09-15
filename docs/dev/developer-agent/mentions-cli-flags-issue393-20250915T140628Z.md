# Developer Log – Surface mentions scanning flags in CLI (Issue #393)

## Context

Specs define mentions scanning config but CLI lacks flags. Implement flags and tests.

## Plan

- Wire flags: mentions.scan.changed_files, mentions.max_file_bytes, mentions.languages
- Apply in src/enrich.ts scanning + utils/commentScanner.ts
- Tests: enable/disable + size cap
- Docs: CLI reference + specs section

## Initial Notes

- Current code already references these flags in src/enrich.ts; ensure CLI plumbs them through and docs/tests cover them.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
