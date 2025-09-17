# Coverage gate consistency across workflows

Category: tests
Priority: low

Context: PR #739 adds an optional coverage gate step in both `.github/workflows/pr-tests.yml` and `.github/workflows/quick-checks.yml`, guarded with `if: ${{ vars.REQUIRE_COVERAGE == 'true' }}` and using `scripts/coverage-thresholds.json`.

Observation:

- The implementations are nearly identical with minor cosmetic differences. This duplication is acceptable but could drift over time.

Suggestion (non-blocking):

- Consider extracting the common bash snippet into a small script (e.g., `scripts/coverage-gate.sh`) used by both workflows. This reduces maintenance and ensures identical behavior.

Notes:

- Not blocking for this PR; current steps are correct, readable, and properly guarded.

References:

- `.github/workflows/pr-tests.yml`
- `.github/workflows/quick-checks.yml`
- `scripts/coverage-thresholds.json`
