# Issue #153 – Expand CLI Quickstart and examples

Owner: documenter-agent
Started: $(date -u)

## Plan
- Update README Quickstart with end-to-end normalize/enrich example using samples.
- Add flags example: `--flag include_patch=false`.
- Note token precedence: `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN`.
- Cross-link `docs/cli/reference.md` and `docs/specs/README.md#12-examples`.
- Verify commands run locally.

## Notes
- Enrichment handles missing token gracefully (partial=true) and still writes flags.

