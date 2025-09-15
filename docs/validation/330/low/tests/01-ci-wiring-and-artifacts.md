# [Validator] Tests/CI – Wiring and Artifacts Checklist

### Context

Discovery mentions GITHUB_STEP_SUMMARY and JSON artifact. Add a short checklist in the doc to ensure CI wiring stays consistent across workflows.

### Checklist (Non‑blocking)

- Common composite action emits `observability.json` with stable schema.
- Upload step names and artifact naming are consistent across jobs.
- Step summary includes thresholds and next actions when breached.
- Check-run annotations only for top hotspots to avoid noise.
- Vitest JUnit + retries enabled and included in artifacts.

### Rationale

Prevents drift and ensures results are machine-consumable for dashboards.

### Scope & Priority

Non‑blocking; tests/CI checklist. Priority: low.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
