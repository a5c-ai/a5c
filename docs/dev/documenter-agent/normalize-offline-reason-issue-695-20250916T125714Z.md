# Docs Update: Normalize offline reason to `flag:not_set`

Issue: #695
Branch: `docs/normalize-offline-reason-695`
Started: 20250916T125714Z

## Scope

- Update `docs/cli/reference.md`: replace occurrences of `github_enrich_disabled` with `flag:not_set`.
- Verify `README.md` alignment (already mentions `flag:not_set`).

## Plan

1. Search for mismatches.
2. Patch CLI reference.
3. Open PR and request validation.

## Results

- Updated docs/cli/reference.md: replaced legacy mention and ensured offline reason uses `flag:not_set`.
- README.md already consistent; no changes needed.
- Opened PR: https://github.com/a5c-ai/events/pull/703
