# Dev Log – Issue #168: Gate GitHub API calls behind --use-github

## Context
Ensure `events enrich` does not make network calls unless `--use-github` is explicitly provided and a token exists.

## Plan
- Add gating in `handleEnrich` to skip importing/calling `enrichGithubEvent` unless `flags.use_github` is true and `githubToken` exists.
- Preserve mentions extraction regardless of flag.
- Update CLI docs and help text.
- Add tests for: no flag (no network), flag + no token (skip/partial marker), flag + token (mock success path).

## Notes
Touch points: `src/enrich.ts`, `src/cli.ts`, `docs/cli/reference.md`, `tests/enrich.basic.test.ts`.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
