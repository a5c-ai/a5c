# Docs: Offline GitHub reason string inconsistent

Priority: low
Category: documentation

Observation:

- `docs/cli/reference.md` mentions two different offline/disabled reasons for `enriched.github`:
  - `flag:not_set` (correct per current implementation)
  - `github_enrich_disabled` (not emitted by the code)
- Implementation at `src/enrich.ts` sets `reason: "flag:not_set"` for offline mode and `reason: "token:missing"` when no token is available in online mode.

Recommendation:

- Unify docs to reference `flag:not_set` (offline) and `token:missing` (no token in online mode), or align code if a different taxonomy is desired.

Rationale:

- Avoids user confusion and keeps CLI reference tightly aligned with behavior.
