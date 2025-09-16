# Work Log — Clarify offline example vs CLI default stub (Issue #698)

Started: 2025-09-16

## Plan

- Add `docs/examples/enrich.offline.stub.json` mirroring CLI default offline stub.
- Update README and `docs/specs/README.md §4.1` to explain both acceptable offline shapes: minimal NE (omits `enriched.github`) vs CLI stub (includes `enriched.github` with `{ provider, partial, reason }`).
- Update `docs/cli/reference.md` to link to examples and avoid over‑specifying the `reason` string.
- Validate the new example in `.github/workflows/quick-checks.yml`.

## Notes

- Code sets `reason: "flag:not_set"` when `--use-github` is omitted and `reason: "token:missing"` for missing token in programmatic paths.
- CLI exits with code 3 on `--use-github` without a token and does not emit JSON; programmatic API may emit a partial object.

## Progress

- Repo scanned; branch created.
- Next: implement docs and example + CI validation.
