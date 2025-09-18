# [Validator] Documentation – Clarify enrich flags and defaults

### Summary

`enrich` supports flags `include_patch` (default false), `commit_limit` (default 50), `file_limit` (default 200), and `--use-github` wiring to `flags.use_github`. README and CLI reference should list defaults and accepted truthy values.

### Recommendation

- Update `docs/cli/reference.md` to document defaults and accepted boolean values (`true,1,yes,y,on`).
- Add note that setting `--use-github` requires a valid `GITHUB_TOKEN`/`A5C_AGENT_GITHUB_TOKEN`.

### Acceptance

- Users can infer behavior and required env from documentation.
- CLI reference anchor `docs/cli/reference.md#events-enrich` documents `include_patch` default as `false` (source of truth).
