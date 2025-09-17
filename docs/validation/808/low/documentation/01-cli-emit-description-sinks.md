# [Low] CLI `emit` description mentions stdout/file only, but supports `github`

Category: documentation
Priority: low

## Context

- PR #808 changes only default sink selection in `src/emit.ts` and adds/clarifies the intended behavior.
- The CLI command description in `src/cli.ts` currently says: "Emit an event to a sink (stdout or file)", but `--sink` also accepts `github`.

## Recommendation

Update the `emit` command description string in `src/cli.ts` to reflect all supported sinks, for example:

- "Emit an event to a sink (stdout, file, or github)"

This is non‑blocking and can be addressed in a follow‑up or when touching CLI help text next time.

## References

- Code: `src/cli.ts` (`program.command("emit")` description)
- Docs: `docs/cli/reference.md` documents the `github` sink and default behavior.
