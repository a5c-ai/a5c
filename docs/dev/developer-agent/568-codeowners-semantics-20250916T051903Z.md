# Worklog: Document CODEOWNERS semantics (union vs last-rule) — #568

## Plan

- Update README Ownership section with concise semantics note linking to routing doc.
- Expand docs/routing/ownership-and-routing.md with a Semantics section comparing union vs last-rule and examples.
- Add a brief note in docs/specs/README.md §4.1 aligning semantics and future toggle mention.
- Open PR against a5c/main, enable auto-merge, and request validation.

## Context

Implementation already computes `enriched.github.pr.owners` (per-file) and `owners_union` (sorted, de-duplicated union). Tests and changelog reference this behavior.
