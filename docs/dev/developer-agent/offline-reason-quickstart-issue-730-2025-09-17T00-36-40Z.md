[Start] Issue #730 - Align Quick Start offline reason to `flag:not_set`

## Context

- Canonical offline reason per README and CLI reference: `flag:not_set`.
- Quick Start shows legacy `github_enrich_disabled`.

## Plan

1. Update docs/user/quickstart.md snippet to `reason: "flag:not_set"`.
2. Add concise note about canonical/stable string.
3. Sweep user docs for `github_enrich_disabled` and confirm none remain.

## Notes

- Do not dedupe quickstart files in this change (out of scope).
- No code changes needed; docs only.
