# Data Model: Enrichment Types

## Namespaces
- `metadata`: repo settings, owners, languages
- `derived`: diffs, commit stats, semantics
- `correlations`: PR<->commit<->issues linkage
- `mentions`: extracted targets with context

## Constraints
- Keep bounded sizes; paginate commits/files
