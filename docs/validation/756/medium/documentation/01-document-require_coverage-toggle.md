# [Medium] Documentation — REQUIRE_COVERAGE toggle and thresholds

Add a short section to `README.md` (or `docs/ci.md`) describing:

- How to enable the optional hard coverage gate via repo variable: set `REQUIRE_COVERAGE=true` in GitHub repository variables.
- Where thresholds are defined: `scripts/coverage-thresholds.json` (single source of truth) and how to change them.
- Expected behavior when the gate is enabled vs disabled.

Rationale: makes the feature discoverable for maintainers and contributors.
