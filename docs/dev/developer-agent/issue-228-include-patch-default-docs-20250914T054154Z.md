# Task log: Align include_patch default and docs (issue #228)

## Context

Specs require `include_patch` default=false to minimize payloads and reduce risk of leaking secrets in diffs. Implementation already defaults to false in `src/enrich.ts`. Docs still say default=true in spots.

## Plan

- Update docs/specs/README.md §4.1 security note to default=false with rationale.
- Update docs/cli/reference.md to show include_patch default=false.
- Ensure README already matches (it does). Run full tests.

## Changes

- [ ] docs/specs/README.md security note
- [ ] docs/cli/reference.md flag defaults

## Notes

No code changes required; tests already cover both true/false variants.
