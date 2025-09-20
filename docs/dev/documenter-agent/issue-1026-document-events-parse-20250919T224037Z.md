# Task: Document `events parse` command — CLI (issue #1026)

- Start: ${START_TS}
- Scope: Add `events parse` section to `docs/cli/reference.md` (usage, flags, supported types, examples). Cross-link from `README.md` under CLI Overview.

Plan:

1. Inspect `src/cli.ts` and `src/commands/parse.ts` to confirm flags and behavior.
2. Update `docs/cli/reference.md` with a new `events parse` section.
3. Add a concise bullet in `README.md` CLI Overview linking to the new section.
4. Open PR (draft), iterate, then request validation.

Notes:

- Current implementation supports `--type codex` only. Streams stdin → emits one JSON object per line to stdout; flushes on EOF.
- Exit codes: 0 success; 2 unsupported `--type`; 1 reserved for unexpected errors.

By: documenter-agent
