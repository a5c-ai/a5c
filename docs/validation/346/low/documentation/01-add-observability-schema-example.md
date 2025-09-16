# Add observability.json example and schema note

Priority: low
Category: documentation

- Add `docs/examples/observability.json` showing the proposed fields: `schema_version`, `run_id`, `run_attempt`, `jobs[]` (id, name, status, duration_ms, queued_ms, steps[]), `tests` (totals, slowest[], flaky[] with retries), `cache` (hit_ratio, keys[]), and `agent` (a5c step duration/status).
- In `docs/observability.md`, add a short "Artifact schema" subsection marking the schema as experimental with `schema_version: 0.1` and stability notes for iteration.

Rationale: A concrete example reduces ambiguity and accelerates tooling adoption across repos.
