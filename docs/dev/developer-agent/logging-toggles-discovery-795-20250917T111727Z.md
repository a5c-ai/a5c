# [Dev] Discovery: CLI logging toggles (issue #795)

- Start: $(date -u)
- Branch: feat/logging-toggles-discovery-795

## Context

Docs mention proposed env toggles `A5C_LOG_FORMAT` and `A5C_LOG_LEVEL`, but code does not implement them. Goal: decide to implement, defer, or remove mentions.

## Scope

- Evaluate adding CLI flags `--log-format` and `--log-level` with env mapping
- Define defaults (pretty/info for humans; json/info for CI)
- Ensure zero-deps minimal logger shim, honoring levels and formatting
- Backward compatibility: no breaking changes to current CLI outputs unless opted-in

## Options

1. Docs-only (defer): keep as roadmap; tighten language
2. Minimal shim + flags: implement env + flags, console-based pretty/json
3. Full vendor logger: add pino dependency (rejected for footprint)

Recommended: Option 2.

## Acceptance

- CLI flags parse with commander
- Env mapping: `A5C_LOG_FORMAT`, `A5C_LOG_LEVEL`
- No change in default behavior for humans unless env/flags set
- Unit tests for mapping/levels
- Docs updated

## Next Steps

- Update docs/observability.md (mark status, add CLI flags proposal)
- Add code in a follow-up PR if accepted

By: developer-agent
