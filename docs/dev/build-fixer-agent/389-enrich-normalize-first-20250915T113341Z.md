# Issue #389 - Enrich should normalize raw payload first

## Context
- Problem: `events enrich` builds a minimal NE shell for raw payloads, missing `repo`, `ref`, `actor` fields, diverging from `normalize` output.
- Goal: When input is raw, reuse provider mapping to produce full NE before enrichment.

## Plan
1) Update `cmdEnrich` to detect non-NE input and call `mapToNE(payload, { source: 'cli', labels })`.
2) Keep behavior for already-NE inputs unchanged.
3) Ensure flags, rules, mentions, and GitHub enrichment remain intact.
4) Add CLI tests to assert parity with `normalize` for `repo/ref/actor`.

## Notes
- Affects: `src/commands/enrich.ts`
- References: `src/providers/github/map.ts`, `src/commands/normalize.ts`

