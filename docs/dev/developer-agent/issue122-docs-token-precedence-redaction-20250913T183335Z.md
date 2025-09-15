# Dev Log – Issue #122: Docs – Config and token precedence + redaction

## Context

Update docs to clearly state token precedence and redaction behavior. Sources: `src/config.ts`, `src/utils/redact.ts`.

## Plan

- Add explicit env precedence section to `docs/specs/README.md`.
- Update `docs/cli/reference.md` with minimal env usage and redaction note.

## Notes

- Precedence: `A5C_AGENT_GITHUB_TOKEN` > `GITHUB_TOKEN`.
- Redaction: patterns + key-based masking; default mask `REDACTED`.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
