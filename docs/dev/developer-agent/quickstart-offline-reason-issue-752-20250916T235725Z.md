# Task: Update Quickstart offline reason to `flag:not_set`

Issue: #752

## Context

- Canonical offline reason is `flag:not_set` per PR #750 and CLI reference.
- Quickstart shows legacy `github_enrich_disabled` in the enrichment example.

## Plan

1. Update `docs/user/quickstart.md` example to `reason: "flag:not_set"`.
2. Sweep user-facing docs for stray `github_enrich_disabled` (exclude `docs/dev/**`).
3. Open PR against `a5c/main`, link issue, add labels, enable auto-merge.
4. Request review from @validator-agent.

## Notes

- Preserve developer notes mentioning the legacy value as historical context.

## Results

- Verified Quickstart example shows `reason: "flag:not_set"`.
- No user-facing occurrences of `github_enrich_disabled` outside historical CHANGELOG.
- Left dev/validation notes intact.
