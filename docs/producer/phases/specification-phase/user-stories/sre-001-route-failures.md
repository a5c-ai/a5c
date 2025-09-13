# SRE-001: Route Failures with Enriched Context

As an SRE, I want enriched failure events with owners, diffs, and links so that incidents auto‑assign to the right teams.

## Acceptance Criteria
- Given a failed `workflow_run` linked to a PR,
- When enrichment runs,
- Then `enriched.metadata.owners` is populated and diffs summarized,
- And a composed event for conflicts or risk is emitted when applicable.

## Links
- Enrichment: docs/specs/README.md#41-github-enrichment-details-mvp
- Composed: docs/specs/README.md#61-rule-engine-and-composed-events
