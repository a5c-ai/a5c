# README cache env naming mismatch

- Category: documentation
- Priority: low
- Context: PR #340 (obs-summary composite action)

### Issue

The README shows an example env `CACHE_NODE_KIND: node`, but the action code only detects envs following the pattern `CACHE_<KIND>_HIT` (e.g., `CACHE_NODE_HIT`). `CACHE_NODE_KIND` is unused and may confuse users.

### Recommendation

Remove `CACHE_NODE_KIND` from the README example or update the action to accept an optional `<KIND>` label alongside \*_HIT flags. Prefer the simpler fix: document only `CACHE_<KIND>\_HIT` usage.

### Impact

Documentation clarity. No runtime impact.
