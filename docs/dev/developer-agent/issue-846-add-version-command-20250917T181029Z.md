# Dev Log: Add `version` command to CLI (issue #846)

Start: 2025-09-17T18:10:29Z

## Plan

- Implement `events version` subcommand in `src/cli.ts` that prints the package version (same as `--version`).
- Keep existing `--version` flag behavior.
- Add a minimal test to assert output equals `package.json` version.
- Update `docs/cli/reference.md` to include the new command.

## Notes

- Commander already wires `--version`; we add an explicit command for parity with other CLIs and scripts that expect `events version`.
