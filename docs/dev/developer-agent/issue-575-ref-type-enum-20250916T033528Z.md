# Issue #575 – NE schema ref.type enumeration

## Context

Issue: https://github.com/a5c-ai/events/issues/575

## Initial analysis

- Schema already enumerates `ref.type` including `"pr"`.
  - docs/specs/ne.schema.json → `enum: ["branch","tag","pr","unknown"]` (nullable)
  - Zod mirror: src/schema/normalized-event.ts → `z.enum(['branch','tag','pr','unknown']).nullable()`
- Provider mapping emits `"pr"` for pull_request events.
  - src/providers/github/map.ts → `mapRef(payload)` sets `type: "pr"` for `payload.pull_request`
- Tests assert PR refs use `"pr"`:
  - tests/normalize.github.test.ts → `expect(ev.ref?.type).toBe("pr")`

Conclusion: Current ecosystem (spec, Zod, provider, tests) consistently uses `ref.type === "pr"` for pull requests.

## Plan

- No schema change now. Removing `"pr"` would be a breaking change (spec + tests + provider).
- Await product decision: keep `"pr"` (recommended for clarity) or migrate to `branch|tag|unknown` only with a deprecation plan.

## Implications of removing `"pr"`

- Breaking surface:
  - docs/specs/ne.schema.json (enum change)
  - src/schema/normalized-event.ts (Zod enum change)
  - src/providers/github/map.ts (emit `branch` instead of `pr` for PRs)
  - tests that assert `ref.type === "pr"`
- Downstream rules/filters relying on `"pr"` would require updates.
- Migration options:
  - Dual-emit or transitional mapping (e.g., keep `"pr"` but add a derived boolean `is_pr`); or
  - Emit `branch` for PRs but include a dedicated field (e.g., `ref.context: 'pr'`)—requires schema extension.

## References

- Schema: docs/specs/ne.schema.json (search for `ref.type` enum)
- Zod: src/schema/normalized-event.ts (`RefSchema`)
- Provider: src/providers/github/map.ts (`mapRef`)
- Tests: tests/normalize.github.test.ts

## Result

- Verified alignment; tests pass locally (`npm test`). No code changes included in this PR—documentation only.
