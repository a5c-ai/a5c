## [Low] Documentation - Document `tests` shape in observability output

### Context
The composer emits an optional `tests` section summarizing vitest results (totals, slowest, flaky). The schema now permits this optional field to support downstream consumers.

### Why
Documenting the `tests` shape will help users understand the additional metadata available and how to consume it safely when present.

### Suggested Actions
- Update README or docs under `docs/specs/` to describe the optional `tests` object:
  - `totals: { total: number, flaky: number, slow_count: number }`
  - `slowest: { fullName: string, status?: string, duration_ms?: number|null, retries?: number }[]`
  - `flaky: { fullName: string, status?: string, duration_ms?: number|null, retries?: number }[]`
- Clarify that `tests` may be omitted entirely.

### Priority
low priority

