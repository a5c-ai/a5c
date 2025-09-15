# Emit CLI docs alignment and UX

- Priority: low
- Category: documentation

## Context

PR #404 adds `events emit` docs. During validation, we aligned the CLI behavior to match the docs by letting `--out` imply `--sink file` (removed Commander default).

## Notes

- The docs now reflect accurate behavior and examples.
- Future idea (non-blocking): support `--quiet` for `emit` (symmetric with `validate`) to suppress stdout when writing to file. This would be a nice-to-have and could be documented after implementation.

## Status

Informational only. No further action required.
