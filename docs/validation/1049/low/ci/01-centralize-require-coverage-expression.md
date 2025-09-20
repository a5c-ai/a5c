# [Validator] CI - Centralize REQUIRE_COVERAGE evaluation

Priority: low

The `REQUIRE_COVERAGE` expression is duplicated in two workflows:

- `.github/workflows/pr-tests.yml`
- `.github/workflows/quick-checks.yml`

To avoid drift, consider centralizing this logic via:

- A reusable workflow that outputs a `require_coverage` value, or
- A small composite action in `.github/actions/require-coverage/` that emits the same output.

This keeps the policy single-sourced and easier to evolve.
