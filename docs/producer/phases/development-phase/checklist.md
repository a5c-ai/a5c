# Development Phase – Checklist

This checklist governs implementation for the MVP defined in the Specs and Technical Specs.

## Setup

- [ ] Repository build is green (CI on PRs and `a5c/main`)
- [ ] Lint and typecheck pass locally and in CI
- [ ] Test framework configured (vitest) with coverage

## Implementation

- [ ] CLI `events` implements NE schema (see docs/specs/ne.schema.json)
- [ ] CLI `events` implements enrichment taxonomy (metadata, derived, correlations)
- [ ] GitHub provider supports core event types (workflow_run, pull_request, push, issue, issue_comment, check_run)
- [ ] Mentions extraction across sources with schema
- [ ] Redaction of secrets and large payload caps
- [ ] Config flags and env vars handled (see docs/specs/README.md#5-configuration)

## Quality

- [ ] BDD acceptance tests implemented for key features (see docs/specs/README.md#9-acceptance-tests-bdd-outline)
- [ ] Unit tests for adapters and enrichers (≥70% coverage)
- [ ] Performance targets validated (see docs/specs/README.md#8-performance-targets-and-constraints)

## Release

- [ ] Build artifacts (dist/\*) generated and CLI binary works (`npm run cli -- --help`)
- [ ] Semantic-release configured and dry-run passes
- [ ] README updated with usage and examples

Links:

- Specs: docs/specs/README.md
- Technical Specs: docs/producer/phases/technical-specs/README.md
