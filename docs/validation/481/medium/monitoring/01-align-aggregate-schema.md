# [Validator] [Monitoring] - Align aggregate JSON schema with docs

### Context

PR #481 introduces `.github/actions/obs-aggregate` which emits an `observability.aggregate.json` file with:

```
{
  "schema_version": "0.1",
  "contributed": ["…"],
  "metrics": { "cache": { "summary": {…}, "entries": [] } },
  "runs": [ … ]
}
```

`docs/observability.md` suggests that aggregate artifacts may include:

- `metrics.cache.overall`: hits, total, hit_ratio, bytes_restored_total
- `metrics.cache.by_kind[]`: per-kind rollups

### Issue

The current aggregate format does not include `overall` and `by_kind`. While not blocking (docs say “may”), adding these will make the artifact more useful and align with expectations.

### Recommendation

- Compute cache `overall` and `by_kind` from merged `entries`/`summary` values.
- Preserve existing fields for backward compatibility.
- Document the aggregate structure in `docs/observability.md` as stable once adopted.

### Priority

medium priority
