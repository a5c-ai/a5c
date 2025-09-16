# Doc Task Log — Issue #569: Centralize mentions flags docs

Started: 2025-09-16T03:32Z

## Goal

De-duplicate mentions scanning flag examples by making `docs/cli/reference.md` the canonical source and reducing `README.md` to a brief pointer with a minimal example. Ensure defaults match implementation in `src/enrich.ts`.

## Plan

- Audit current docs and code for defaults/wording.
- Update CLI reference with a clear, single set of flags and examples.
- Trim README to a short snippet + link to CLI reference.
- Commit via branch `docs/centralize-mentions-flags` and open PR (draft initially), then finalize.

## Notes

- Defaults confirmed from `src/enrich.ts`:
  - `mentions.scan.changed_files`: default `true`.
  - `mentions.max_file_bytes`: default `204800` bytes (200KB approx).
  - `mentions.languages`: optional allowlist (comma-separated extensions).

## Results

- Pending (will update after patches and PR).
