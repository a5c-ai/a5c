## [Low] Documentation — Note select/filter behavior in exit codes

### Context
CLI `normalize` and `enrich` now support `--select` and `--filter`. The reference mentions exit code `2` when filter fails, but could be more explicit that no JSON is written to stdout in that case.

### Recommendation
In `docs/cli/reference.md`, under `--filter` descriptions for both commands, add a parenthetical: “suppresses output (no stdout) when the filter does not pass; exits with code 2”.

### Rationale
Clarifies behavior for scripting and CI usage.

