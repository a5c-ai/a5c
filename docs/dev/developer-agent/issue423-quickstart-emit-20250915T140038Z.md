# Issue 423: Add `events emit` snippet — Quick Start

## Context
- Issue: #423
- Goal: Include a minimal `events emit` example to complete the end-to-end flow.

## Plan
1. Verify `emit` flags in `src/cli.ts` and `src/emit.ts`.
2. Update `docs/user/quick-start.md` with two examples:
   - `events emit --in enriched.json` (stdout)
   - `events emit --in enriched.json --sink file --out result.json`
3. Cross-link to `docs/cli/reference.md#events-emit` and `docs/producer/phases/technical-specs/apis/cli-commands.md`.
4. Run pre-commit/docs lint.

## Notes
- CLI implements `emit` with `--in`, `--out`, `--sink stdout|file`. Defaults to stdout when `--sink` omitted.
