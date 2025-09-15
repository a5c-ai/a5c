# [Validator] Documentation — Duplicate CLI flags lines

Severity: low priority

In `docs/specs/README.md` §5 (Configuration), there appear to be duplicated bullets for CLI flags (lines ~94–99). Consolidate to a single accurate set to reduce confusion.

Example excerpt (context):

```
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`, `--select paths`, `--filter expr` expr`.
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`.
- CLI flags (planned/not yet implemented): `--select fields`, `--filter expr`.
- CLI flags (implemented): `--in file.json` (webhook sample), `--out out.json`, `--label key=value`, `--select paths`, `--filter expr` expr`.
```

Action:

- Remove duplicates; ensure one authoritative list with correct flags and wording.
