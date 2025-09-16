# [Validator] Tests/Docs – Duplicate mentions flags bullets

### Category

tests

### Priority

medium priority

### Context

`README.md` under CLI Reference lists mentions flags twice (first concise list, then a longer list that re-lists the same flags). This can drift over time and confuse readers about the source of truth for defaults.

### Suggested Fix

- Deduplicate flags documentation in `README.md`, keeping a single authoritative bullet list for mentions flags, and refer to `docs/cli/reference.md` for full details.
- Consider adding a small script/check to prevent duplicated flag bullets in future edits.

### Notes

- Non‑blocking for PR #632.
