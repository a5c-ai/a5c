## [Low] Tooling – Ignore tmp-enrich outputs

### Context

- PR #468 originally included several `tmp-enrich-*.json` files generated during local runs.
- These were removed in commit c9d5d69 on branch `work/fix-460` to keep the PR docs-only.

### Recommendation

- Add `tmp-enrich-*.json` to `.gitignore` in a separate housekeeping PR (or include in PR #459 if convenient) to prevent accidental commits.

### Rationale

- Reduces noise in diffs and avoids leaking transient artifacts.

### Scope

- Update root `.gitignore` only; no code changes required.
