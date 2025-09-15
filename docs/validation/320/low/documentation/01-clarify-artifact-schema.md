# Clarify observability.json schema and stability

Priority: low
Category: documentation

- Define a minimal JSON schema for `observability.json` (fields: run_id, jobs[], tests[], cache, durations, retries) and document it in the repo (docs/observability.md).
- Mark schema as experimental with clear versioning (e.g., schema_version: 0.1) to enable safe iteration.
- Add an example artifact to `docs/examples/observability.json` for consumers.

Rationale: Developers can rely on a stable contract and build tooling or dashboards without scraping step summaries.
