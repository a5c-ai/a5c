# Worklog: Align offline enrichment reason to `flag:not_set` (issue #664)

## Context

Docs and spec require `enriched.github.reason: "flag:not_set"` for offline mode, but code/tests may diverge.

## Plan

- Update `src/enrich.ts` offline branch to set `reason: "flag:not_set"`.
- Update tests expecting offline reason.
- Keep `token:missing` semantics for programmatic path and CLI exit code 3 when `--use-github` without token.

## Notes

- README and docs already reflect `flag:not_set`. Sweep dev notes later if needed.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
