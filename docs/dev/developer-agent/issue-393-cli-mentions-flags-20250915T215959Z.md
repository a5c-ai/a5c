# Dev Log — Issue #393: Surface mentions scanning config via CLI

## Summary

Implement CLI surface for mentions scanning flags and thread them through `enrich`.

## Plan

- Delegate `src/commands/enrich.ts` to `handleEnrich` for parity.
- Preserve CLI exit code 3 when `--use-github` but no token.
- Ensure `handleEnrich` respects flags `mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages` for code comment scanning.
- Run tests, update docs later if needed.

## Notes

- Added early token check in CLI wrapper to return status 3, matching tests.
- `handleEnrich` now uses provided flags to control API content scan and size/language filters.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
