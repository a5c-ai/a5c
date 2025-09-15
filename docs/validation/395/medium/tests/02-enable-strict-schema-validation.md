# [Validator] [Tests] - Enable strict schema validation for observability artifact

Priority: medium priority

Context:

- PR #395 introduces `docs/specs/observability.schema.json` (v0.1) and a warn-only validation path.
- Current workflow validates the example via `scripts/validate-observability.mjs` and keeps composite validation optional/warn-only.

Proposal:

- After schema stabilizes across a few runs, switch CI to strict validation for produced artifacts.

Actions:

- In `.github/workflows/tests.yml`, set `OBS_VALIDATE_SCHEMA=true` for the `Observability summary` step to fail on mismatches.
- Optionally add a guarded job/environment toggle to allow temporary opt-out on hotfix branches.
- Monitor first few runs and revert to warn-only if flakiness surfaces.

Rationale:

- Strict validation prevents silent drift between producers and the documented v0.1 schema.

Files:

- `.github/workflows/tests.yml`
- `.github/actions/obs-summary/action.yml`

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
