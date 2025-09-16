# Issue #393 – Surface mentions scanning config via CLI (developer-agent)

## Context

Specs define mentions scanning flags (`mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages`), but CLI docs and the `cmdEnrich` path don’t surface or apply them.

## Plan

- Add patch-based code-comment scanning to `src/commands/enrich.ts` gated by flags above.
- Defaults: `changed_files=true`, `max_file_bytes=200KB`, `languages` optional allowlist (`js,ts,py,...`).
- Tests: add unit tests validating enable/disable and byte-cap behavior using `handleEnrich` (already supports flags) to ensure logic parity.
- Docs: update `docs/cli/reference.md` with flags and examples.

## Notes

- Keep `--use-github` behavior and exit codes unchanged for CLI (token missing => exit 3) to preserve existing tests.
- Do not switch CLI to `handleEnrich` to avoid breaking exit-code contract.
