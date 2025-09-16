# Offline example consistency: enriched.github stub vs omission

- Priority: medium
- Category: documentation
- Files: docs/specs/README.md

## Issue

The docs currently mention both shapes for the offline enrich example:

- At §4 (around the examples list): offline is described as including `enriched.github` with `partial=true` and `reason: "flag:not_set"`.
- At §4.3 ("Offline enrichment sample") the text says the minimal NE document is "without `enriched.github`".

This is contradictory and may confuse readers and test authors.

## Recommendation

Adopt a single canonical offline shape in the docs to match the examples and CLI behavior:

- Prefer including the stub `enriched.github` with `partial=true` and `reason: "flag:not_set"` (current example `docs/examples/enrich.offline.json`).
- Update the conflicting paragraph to reflect the stub-included shape.

Rationale: keeps observability and downstream routing consistent even when GitHub enrich is disabled.

## Acceptance

- Remove contradictory statement(s).
- Ensure both README and docs/specs reference the same offline shape and point to `docs/examples/enrich.offline.json`.
