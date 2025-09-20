# Build Fix: Missing docs/examples/enrich.offline.stub.json causes Quick Checks failure

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17880723727
- Failing step: "Validate offline stub example (NE schema)"
- Error: ENOENT for `docs/examples/enrich.offline.stub.json`

## Plan

- Add `docs/examples/enrich.offline.stub.json` aligned with NE schema
- Use current `docs/examples/enrich.offline.json` shape as the stub baseline
- Verify locally via `node dist/cli.js validate` against `docs/specs/ne.schema.json`
- Push fix and let Quick Checks re-run

## Notes

- Keeps example validation without disabling CI coverage
- Aligns with references in docs (`docs/specs/README.md`)

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
\n## Results

- Added docs/examples/enrich.offline.stub.json
- Local CLI validation passed
- PR #1099 opened and marked ready
