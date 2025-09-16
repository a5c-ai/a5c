# Issue #573 – Align ref.type semantics (branch|tag|unknown)

## Summary

- Stop emitting `ref.type: "pr"` for GitHub pull_request events.
- Set PR `ref.type` to `"branch"` while preserving `ref.base` and `ref.head`.
- Update schema/docs/tests accordingly.

## Plan

1. Update `src/providers/github/map.ts` to set PR ref.type to `"branch"`.
2. Update `docs/specs/ne.schema.json` to remove `"pr"` from enum.
3. Update tests expecting `"pr"` to expect `"branch"` (and keep base/head checks).
4. Update specs doc `docs/specs/README.md` to remove `pr` from core types list and align `ref` model description if needed.
5. Run tests and adjust fixtures if needed.
6. Open PR (fixes #573).

## Notes

- This aligns `ref.type` with provider-agnostic ref kinds.
- PR-ness is already conveyed via top-level `type: "pull_request"` and `payload.pull_request`.
