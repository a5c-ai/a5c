# Research Log – Specs for docs/specs/README.md (Issue #17)

## Intent
Author comprehensive project specifications for the Events SDK/CLI.

## Plan
- Analyze repo context (workflows, seed constraints)
- Draft sections per acceptance criteria
- Provide examples for GitHub Actions and webhook payloads
- Define MVP vs stretch; roadmap

## Notes
- Primary branch: a5c/main
- Workflows: .github/workflows/{a5c.yml, main.yml, deploy.yml}
- Seed constraints in seed.md (do not write blindly; deliberate research)


## Results (2025-09-12)
- Created feature branch and draft PR
- Authored initial specifications at docs/specs/README.md with requested sections
- Cross-referenced .github/workflows and seed.md; added examples

## Next Steps
- Gather feedback; refine sections; mark PR ready and request validation

## Update (2025-09-12 23:50Z)
- Expanded specs per @tmuskal request:
  - Added commit log/diff enrichment details and PR conflict status
  - Defined mentions extraction schema, config, and limits
  - Introduced composed events rule model with example `conflict_in_pr_with_low_priority_label`
  - Extended BDD outlines and examples
