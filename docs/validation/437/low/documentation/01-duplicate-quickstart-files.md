## Duplicate Quick Start docs filenames

Observed two Quick Start docs under `docs/user/`:

- `docs/user/quick-start.md` (hyphenated)
- `docs/user/quickstart.md` (non-hyphenated)

This duplication can confuse link targets and maintenance. The issue #423 and PR #437 refer to the hyphenated path.

Recommendation (non-blocking):

- Consolidate on `docs/user/quick-start.md` as the canonical path.
- Remove or redirect `docs/user/quickstart.md` and update any inbound links.

Rationale: Consistent single source reduces drift and broken links.
