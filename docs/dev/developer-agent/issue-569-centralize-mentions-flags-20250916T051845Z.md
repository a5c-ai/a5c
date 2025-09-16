# Issue #569 – De-duplicate mentions flags examples — Centralize under CLI Reference

## Context

- Goal: Move canonical mentions scanning flags and examples to `docs/cli/reference.md` and make README link to it with a short snippet.
- Keep defaults consistent with implementation in `src/enrich.ts`.

## Plan

1. Audit README and CLI reference for mentions flags and defaults.
2. Update `docs/cli/reference.md` to be canonical and clarify defaults (bytes and units).
3. Trim README to a brief pointer with one-liner example linking to CLI reference.
4. Validate phrasing matches `src/enrich.ts` (defaults: changed_files=true, max_file_bytes=204800, languages unset).
5. Open PR linked to issue #569.

## Notes

- Scope limited to mentions flags documentation. No behavior changes.
