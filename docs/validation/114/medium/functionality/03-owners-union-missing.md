# PR owners union missing (spec mentions union at PR level)

Priority: medium
Category: functionality

Implementation returns per-file owners map under `enriched.github.pr.owners`, but the spec (§4.1) also mentions maintaining a union of all code owners at the PR level.

Suggestion:
- Add `enriched.github.pr.owners_union: string[]` with the deduplicated set of owners across all changed files.

Rationale: convenient for routing/mentioning teams without scanning the per-file map.
