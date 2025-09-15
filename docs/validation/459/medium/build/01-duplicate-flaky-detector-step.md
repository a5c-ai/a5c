# Duplicate flaky-detector step in tests workflow

Category: build | Priority: medium

The `.github/workflows/tests.yml` file currently defines two consecutive steps both named "Flaky tests detection" under the `unit` job. This duplicates effort, increases noise, and may diverge over time.

- File: `.github/workflows/tests.yml`
- Context: unit job after coverage uploads
- Suggestion: Deduplicate into a single step with the robust quoting and `continue-on-error: true`, keeping the variant that writes `/tmp/flaky.md` and upserts the PR comment via `gh`.

Rationale: Reduces runtime noise and maintenance surface while keeping the improved quoting and non-blocking behavior.
