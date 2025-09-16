# Producer Agent – Generic Scan (Issue #224)

## Summary

Trigger: issue comment mention to @producer-agent.
Scope: Analyze specs vs implementation; surface gaps; generate actionable issues; update project phase; open PR with findings.

## Initial Plan

- Read docs/specs/README.md and phase files
- Review src CLI/SDK for normalize/enrich/mentions
- Compare against specs: include_patch default, rules engine, validate command, zod schema
- Propose issues with acceptance criteria and dependencies
- Update project phase and checklist

## Findings (will be updated)

- TBC

By: [producer-agent](https://app.a5c.ai/a5c/agents/development/producer-agent)

## Findings

Based on docs/specs/README.md and current codebase:

1. Enrichment flag default mismatch (include_patch)

- Spec says default false; CLI docs currently say default true, and implementation in src/commands/enrich.ts and src/enrich.ts should default to false to minimize payload size. Verify and align both code and docs.
- Acceptance: `events enrich --in samples/pull_request.synchronize.json --use-github` omits `patch` by default; `--flag include_patch=true` includes it.

2. Validate command exists but needs tests and wiring in docs

- `events validate` is implemented (src/cli.ts) and tests exist under tests/cli.validate.test.ts. Ensure docs cross-reference it in README and specs, and add CI step.
- Acceptance: Lint/docs updated; CI `tests.yml` runs a validation sample job.

3. Rules engine for composed events not present yet

- Specs mention `--rules` to emit `composed[]`. CLI options include `--rules` but handler `cmdEnrich`/`handleEnrich` do not implement composition. Implement minimal rule matching (YAML/JSON) with examples.
- Acceptance: Given sample rules, enrich adds `.composed[]` per spec with key/reason/targets; tests cover 2 scenarios from specs.

4. NE schema Zod parity

- JSON Schema is present and used in tests; Zod schema generation not implemented. Optional but helps internal typing.
- Acceptance: `src/schema/normalized-event.ts` defines zod schema aligned to docs/specs/ne.schema.json; tests compile & validate sample payloads.

5. Provider coverage

- `mapToNE` covers pull_request, workflow_run, push, issue_comment. Missing minimal `issue` and `check_run` mapping outlined by specs.
- Acceptance: Add detection/mapping; tests for each.

6. Project phase

- Current phase is Specification Phase; move to Development Phase and add checklist. Sync with progress in this PR.

## Proposed Issues

- [Producer] CLI – Align include_patch defaults and docs
- [Producer] Enrichment – Implement rules engine for composed events
- [Producer] Schema – Add Zod NE schema and tests
- [Producer] Provider – Add issue/check_run normalize mapping + tests
- [Producer] CI/Docs – Wire `events validate` into README and CI

\n## Created Issues
https://github.com/a5c-ai/events/issues/228
https://github.com/a5c-ai/events/issues/229
https://github.com/a5c-ai/events/issues/230
https://github.com/a5c-ai/events/issues/231
https://github.com/a5c-ai/events/issues/232
