# Dev Log — Issue #167: `--source actions` auto-read GITHUB_EVENT_PATH

## Context
- Enhance CLI `normalize` to read `GITHUB_EVENT_PATH` when `--in` not provided and `--source actions`.

## Plan
1. Add helper in `src/cli.ts` to resolve input path from env.
2. Update `handleNormalize` call to supply resolved `in`.
3. Emit friendly error when env missing.
4. Update docs: `docs/cli/reference.md` usage description.
5. Add tests in `tests/cli.actions-source.test.ts` for present/missing env.

## Notes
- Keep behavior backwards compatible: explicit `--in` always wins.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
