# Observability discovery — logging/monitoring/tracing (Issue #286)

Start time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Scope
- Author docs/observability.md with logging/tracing/error-reporting guidance for library consumers.
- Propose optional runtime shim (src/log.ts) and follow-up issues.

## Plan
1. Draft docs with concrete proposals, trade-offs, examples.
2. Align with existing scripts/workflows; note env toggles.
3. Open follow-up issues for code shims and CI hooks.

## Notes
- Keep this PR docs-only; no runtime code changes.
