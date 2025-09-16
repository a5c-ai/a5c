# [Validator] Documentation – Offline enrich reason inconsistency

### Category

documentation

### Priority

low priority

### Context

The offline GitHub enrichment stub reason differs between code and docs:

- Code (`src/enrich.ts`): sets `enriched.github.reason = "flag:not_set"` when `--use-github` is not provided.
- Docs (`README.md`, `docs/cli/reference.md`): describe the offline stub as `reason: "github_enrich_disabled"`.

Tests currently assert `flag:not_set` in several places, so the code and tests are aligned, while parts of the docs are not.

### Suggested Fix

- Align documentation to reflect `flag:not_set` OR update the implementation (and tests) to the preferred, single canonical value.
- Add a brief “reason values” table in CLI docs to avoid future drift.

### Notes

- Non‑blocking for PR #632 (mentions scan source flags). This is a cross‑cutting docs alignment.
