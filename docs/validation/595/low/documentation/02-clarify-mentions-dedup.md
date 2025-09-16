# [Low] Documentation — Clarify mentions de-duplication semantics

- PR: #595
- Category: documentation
- Priority: low priority

## Context

`docs/cli/reference.md` mentions that mentions are "deduplicated by normalized target and location when applicable". Readers may wonder how duplicates across different `source` values (e.g., `issue_title` vs `issue_body`) are handled.

## Suggestion

Add one sentence clarifying that duplicates are removed within the same source/location, and that the same `normalized_target` can appear under different `source` values (e.g., title vs body), which is by design for traceability.

## Rationale

Improves predictability for downstream consumers filtering by `source`.
