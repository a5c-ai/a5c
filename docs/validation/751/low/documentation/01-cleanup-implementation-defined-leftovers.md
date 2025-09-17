# [Low] Documentation — Leftover “implementation-defined” mentions in internal notes

### Context

- PR #751 aligns CLI docs to the canonical offline reason: `flag:not_set` and removes the old “implementation-defined” sentence from `docs/cli/reference.md`.
- A quick sweep shows a few remaining occurrences of the term “implementation-defined” in internal validation/dev notes.

### Findings

- `rg -n "implementation-defined"` matched 4 occurrences across `docs/**` (validation/dev notes), not in user-facing reference pages.

### Recommendation

- Non-blocking cleanup: update or annotate the remaining mentions to reflect current terminology (“canonical, stable: `flag:not_set`”).
- Scope these edits to internal notes only; user-facing docs are already correct in this PR.

### Priority

- Low priority (tech-debt / cleanup)
