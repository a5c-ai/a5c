# Docs Task: Tighten provenance.source docs — CLI vs Schema (Issue #560)

Start: $(date -u)

Scope:

- Align README and CLI docs: persisted `provenance.source` uses `action|webhook|cli` per `docs/specs/ne.schema.json`.
- Clarify CLI accepts `--source actions` as input alias but normalizes to `action`.
- Add unit test asserting `--source actions` yields `provenance.source === "action"` and schema-valid NE.

Plan:

1. Update README: replace examples showing `--source actions` persisted value with wording that stored value is `action`.
2. Adjust CLI help text for `normalize` to mention alias behavior.
3. Ensure code normalizes `actions` -> `action` before constructing NE.
4. Add test under `tests/` covering alias normalization and schema validation.
5. Run tests; open PR.
