# Dev Log — CODEOWNERS Semantics (Issue #568)

## Context

- Goal: Clarify that enrichment computes `owners_union` as a sorted, de‑duplicated union of CODEOWNERS across all changed files, unlike GitHub’s last‑matching‑rule semantics.
- Targets:
  - README Ownership section: concise note + link
  - docs/routing/ownership-and-routing.md: add Semantics subsection with side‑by‑side examples
  - docs/specs/README.md §4.1: one‑line note re: union semantics and potential future toggle

## Plan

1. README note + link
2. Routing doc Semantics + examples
3. Specs §4.1 note

## Notes

- Preserve existing terminology (`owners_union`) and links.
- Use `@org/team` and `@user` mixed examples.
