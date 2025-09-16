# Issue #250 – Add PR title mentions coverage

## Plan

- Add fixture with PR title containing an @mention
- Write test using `handleEnrich` to assert `enriched.mentions` includes `source: 'pr_title'`
- Verify `normalized_target` and non-empty `context`

## Notes

- No GitHub API calls; offline mode
