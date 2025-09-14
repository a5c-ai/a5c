# Doc consistency: include_patch default references

- Category: documentation
- Priority: low
- Context: This PR updates docs to reflect `include_patch` default=false, matching implementation (`src/enrich.ts`, `src/commands/enrich.ts`) and tests.
- Note: A few historical validation notes still reference default=true (e.g., `docs/validation/200/low/documentation/01-clarify-cli-flags.md`). These are archival findings, not user-facing docs. Consider updating or annotating them on a future pass to avoid confusion.

Suggested follow-up (non-blocking):
- Add a short disclaimer to older validation notes that the current default is false and refer to `docs/cli/reference.md` for the source of truth.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
