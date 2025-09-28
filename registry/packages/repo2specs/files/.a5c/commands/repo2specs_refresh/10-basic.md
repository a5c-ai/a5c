## Command: repo2specs_refresh

Goal: Re-run targeted sections of Repo2Specs to keep documentation current.

### Steps
1. Determine refresh scope from event payload (labels, command options, timeframe).
2. Re-scan affected directories or components only (e.g., new feature module, updated pipeline).
3. Update corresponding docs in `docs/repo2specs/**` with deltas highlighted.
4. Note regression checks and guardrails that should be re-validated.
5. Provide status summary with side-by-side comparison when possible.

### Outputs
- Diffs or updated docs with refresh timestamp.
- Comment summarizing refreshed items and any remaining TODOs.

