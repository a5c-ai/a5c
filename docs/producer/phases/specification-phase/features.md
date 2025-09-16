# Specification Phase – Features Catalog

This catalog lists MVP features for the Events SDK/CLI and links each item to the high‑level spec in `docs/specs/README.md`.

## MVP Features

- Normalize events to a unified schema
  - Sources: GitHub Actions, webhooks; extensible via adapters.
  - See: docs/specs/README.md#3-event-sources-types-and-normalization-model
- CLI for normalize and enrich
  - Commands: `events normalize`, `events enrich`; input via `--in` or provider runtime, output JSON.
  - See: docs/specs/README.md#5-configuration
- GitHub adapter (provider)
  - Support core event types: `workflow_run`, `pull_request`, `push`, `issue`, `issue_comment`, `check_run`.
  - See: docs/specs/README.md#3-event-sources-types-and-normalization-model
- Enrichment taxonomy
  - metadata (repo/org flags), derived (diff stats, commit list), correlations (PR ↔ commits ↔ issues), mentions extraction.
  - See: docs/specs/README.md#4-enrichment-taxonomy and docs/specs/README.md#41-github-enrichment-details-mvp
- Mentions extraction
  - Parse `@agent` / `@user` across commits, PR/issue, and code comments with locations.
  - Schema: docs/specs/README.md#42-mentions-schema
- Redaction and safe logging
  - Remove secrets from env/logs; cap file sizes and scan limits.
  - See: docs/specs/README.md#5-configuration and docs/specs/README.md#8-performance-targets-and-constraints
- Rules and composed events (early outline)
  - Optional: emit composed events for patterns (e.g., conflicted PR + label).
  - See: docs/specs/README.md#61-rule-engine-and-composed-events
- Examples and BDD outlines
  - Copy‑pasteable CLI samples and acceptance criteria skeletons.
  - See: docs/specs/README.md#12-examples and docs/specs/README.md#9-acceptance-tests-bdd-outline

## Non‑Goals (Phase 1)

- Long‑running service or UI dashboards.
- Multi‑tenant orchestration.
- Non‑GitHub providers beyond adapter stubs.

## Notes

- Keep output artifacts small by default; allow opting into heavy diffs/patches.
- Make adapters and enrichment hooks pluggable from the start.
