# Issue 560 - provenance.source alias

- Start: 2025-09-16T06:49:45Z
- Plan:
  - Update README and docs to prefer 'action' as persisted provenance.source
  - Keep CLI accepting alias 'actions'; document normalization
  - Add unit test for CLI normalization --source actions -> 'action' and Ajv validate

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)

## Results

- Updated docs:
  - README.md: clarified `--source` values and alias normalization (stored `provenance.source: "action"`).
  - docs/cli/reference.md: canonicalized `action` and kept alias note.
  - docs/producer/cli-normalize.md: noted alias normalization when using Actions (`GITHUB_EVENT_PATH`).
- Code already handled alias via `coerceSource` in `src/commands/normalize.ts` and `src/providers/github/map.ts`.
- Tests already present covering the alias:
  - `tests/normalize.source-alias.test.ts`
  - `tests/cli.normalize-source-alias.test.ts`
- Ran full test suite: all passing locally.

End: $(date -u +%FT%TZ)
