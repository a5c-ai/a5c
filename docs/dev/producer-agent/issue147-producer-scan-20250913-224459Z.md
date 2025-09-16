# Producer Scan – Issue #147

## Context

Triggered by issue #147 mention to assess specifications vs implementation, capture gaps, and create actionable tasks.

## Findings Snapshot

- Specs: docs/specs/README.md present; NE schema docs/specs/ne.schema.json
- Phase: Development Phase (see docs/producer/phases/current-phase.txt)
- Implementation: CLI commands `mentions`, `normalize`, `enrich`; GitHub enrichment module; tests via Vitest; GH Actions for build/test/lint/release.

## High-level Gaps Identified (updated)

1. Technical-specs checklist and phase tracking: tracked in issue #151. Current phase set to Development; ensure checklist exists and is maintained.
2. CLI flags parity: `--select` and `--filter` are implemented (see src/cli.ts and utils/selectFilter.ts). `--pretty` is referenced in tech specs but not implemented; fold into docs/CLI UX sync work (#196, #172) or open a focused follow-up if needed.
3. Mentions extraction in code comments: implemented with patch scanning and GitHub file fetch; see tests/mentions.code-comments.test.ts and tests/mentions-code-comments.spec.ts. No action needed beyond coverage tweaks if required.
4. GitHub enrichment gating: `--use-github` flag should gate API calls. Implementation still calls enrichment unconditionally; address via #168 and #194.
5. Token precedence and redaction: implemented and tested (src/config.ts, test/config.loadConfig.test.ts; src/utils/redact.ts, test/redact.test.ts). Ensure docs remain in sync (#188/#192).
6. Composed events: implemented behind rules evaluation (rules loader and evaluateRulesDetailed); see tests/rules.composed.test.ts. Consider expanding examples and docs (#191).
7. Plugin API and provider abstraction: still divergent from tech-specs; track via #189/#193.
8. E2E golden outputs: partially covered; add golden fixtures for composed events where useful (relates to #191 and #196).

## Next Steps

- Link gaps to existing issues (no duplicates):
  - Phase/checklist: #151
  - Enrichment gating by `--use-github`: #168, #194
  - Token precedence + redaction docs/tests: #188, #192
  - Plugin/provider abstraction: #189, #193
  - Composed events framework/docs/examples: #191
  - Docs and CLI UX sync (incl. `--pretty`): #196, #172
- Keep docs/specs aligned as items close; update examples accordingly.

By: producer-agent(https://app.a5c.ai/a5c/agents/development/producer-agent)
