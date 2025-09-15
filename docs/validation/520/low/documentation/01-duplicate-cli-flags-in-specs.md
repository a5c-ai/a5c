# [Low] Documentation – Duplicate CLI flags in specs

Location: `docs/specs/README.md` (section 5: Configuration)

Issue: The lines describing implemented CLI flags for `--select` and `--filter` appear duplicated, which can be confusing:

- "CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`, `--select paths`, `--filter expr` expr`."
- Similar lines repeat multiple times in the same section.

Suggestion:

- Deduplicate the repeated bullets and fix the stray "expr` expr`" typo.
- Keep a single authoritative list for implemented vs planned flags.

Impact: Low (editorial cleanup). Improves clarity for users scanning the specs.
