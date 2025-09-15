## [Validator] [Monitoring] - Add formal JSON Schema for `observability.json`

### Context

PR #362 introduces `docs/observability.md` and an example artifact at `docs/examples/observability.json` with `schema_version: "0.1"`. Standardizing this artifact with a JSON Schema will enable validation in CI and future tooling.

### Why

- Enforce consistent structure across workflows and repos.
- Allow `obs-summary`/`obs-collector` actions to validate and fail fast on malformed data.
- Enable downstream dashboards to trust fields and evolve additively.

### Requirements

- Define `docs/specs/observability.schema.json` (Draft 2020-12) for v0.1.
- Cover top-level fields: `repo`, `workflow`, `job`, `run`, `metrics`.
- `run`: `id` (number|string), `attempt` (number), `sha` (string), `ref` (string), `actor` (string), `event_name` (string), `conclusion` (string), optional `started_at`/`completed_at` (RFC 3339), optional `duration_ms` (number).
- `metrics.coverage.total`: `lines|functions|branches|statements` each with `{ pct, covered, total }` numbers.
- `metrics.cache`: `entries[]` with `{ kind, hit }` and `summary` with `{ hits, misses, total }` numbers.
- Mark all fields additive/optional where appropriate to allow forward compatibility.
- Add a `npm run validate:obs` script using `ajv` to validate a file against the schema.
- Wire optional validation step into `.github/actions/obs-summary` (non-blocking; warn-only initially).

### Acceptance

- Schema file present with tests validating the provided example (`docs/examples/observability.json`).
- CI step validates artifact in a sample workflow without flakiness.

### Priority

medium priority
