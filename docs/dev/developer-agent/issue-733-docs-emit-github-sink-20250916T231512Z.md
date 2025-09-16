# Issue #733: Document GitHub sink in `events emit`

## Plan

- Read `src/emit.ts` to confirm envs and payload mapping
- Update `docs/cli/reference.md` under `events emit` with a "GitHub sink" subsection
- Include required env vars, payload shape, examples, and cautions
- Open PR linked to #733

## Notes

- Env: `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`, `GITHUB_REPOSITORY=owner/repo`
- Maps `event_type` from `ev.event_type || ev.type || "custom"`
- Maps `client_payload` from `ev.client_payload || ev.payload || ev`
- Redaction applied pre‑emit
