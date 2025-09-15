# Issue #336 – Ownership & routing: CODEOWNERS + docs

## Goal

Introduce a repo-level CODEOWNERS and concise docs explaining how ownership is resolved and used for routing/enrichment (owners map + owners_union).

## Plan

1. Add .github/CODEOWNERS with sensible path patterns
2. Create docs/routing/ownership-and-routing.md with examples
3. Link from README
4. Verify build/tests

## Notes

- owners_union already computed by enrichGithubEvent.js
- Adjust teams in CODEOWNERS to your org conventions
