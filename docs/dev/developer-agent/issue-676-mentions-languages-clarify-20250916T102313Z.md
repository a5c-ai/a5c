# Issue #676 — Clarify mentions.languages allowlist format (initial)

## Plan

- Inspect `src/utils/commentScanner.ts` to confirm accepted language ids
- Update `docs/cli/reference.md` Mentions scanning flags section with table and examples
- Add a concise pointer in `README.md` to the CLI reference

## Notes

- Acceptance: CLI docs list canonical ids (ts, js, py, go, java, c, cpp, sh, yaml, md) and example `--flag mentions.languages=ts,js,md`.
- Dot prefixes likely not required; clarify behavior (ignored/unsupported) to avoid confusion.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
