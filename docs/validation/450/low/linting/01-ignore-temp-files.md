### Observation

Temporary files were committed in this PR branch: `.a5c-tmp/*` and `tmp-enrich-*.json`.

### Impact

- Noise in diffs and risk of future drift; not functionally blocking.

### Action Taken (non-blocking)

- Removed the committed temp files.
- Added ignore rules to `.gitignore` for `.a5c-tmp/` and `tmp-enrich-*.json` to prevent recurrence.

### Recommendation

No further action required; keep ignores in place.

Category: linting
Priority: low
