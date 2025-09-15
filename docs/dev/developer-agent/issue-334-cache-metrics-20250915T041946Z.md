## Summary
Add cache metrics (hit/miss) into `.github/actions/obs-summary` step summary and `observability.json`. Wire the tests workflow to provide cache info from `actions/setup-node@v4` outputs.

## Plan
- Extend composite action to accept env such as `CACHE_NODE_HIT`, `CACHE_NODE_PRIMARY`, `CACHE_NODE_KEY`, and map to `metrics.cache`
- If provided, append a concise cache line to the GITHUB_STEP_SUMMARY
- Update action README with examples
- Update `.github/workflows/tests.yml` to name the setup-node step and pass outputs to the action env
- Validate via local scripts and CI

## Notes
- `setup-node@v4` exposes `outputs.cache-hit`, but not the primary key. We can still include a boolean hit indicator.
- Keep behavior optional: if envs not present, omit cache section.
