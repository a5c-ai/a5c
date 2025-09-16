# [Low] Documentation — Dev notes still reference `flag:not_set`

- Scope: historical developer notes under `docs/dev/**` and `docs/validation/**` mention the former offline reason `flag:not_set`.
- Product contract now standardizes offline stub to `github_enrich_disabled`.
- These notes are non-user-facing and historical; not blocking, but consider a small banner at top of those notes or a final footnote clarifying the current contract.

Findings (examples):

```
rg -n "flag:not_set" docs/dev docs/validation
```

Suggested next step:

- Option A: leave as historical records (no change).
- Option B: add a one-liner at the top: "Updated: offline reason is now `github_enrich_disabled` (replaced previous `flag:not_set`)."
