# [Validator] [Tests] - Threshold parser robustness for coverage summary

Context: PR #313 adds `scripts/coverage-summary.js` that parses `vitest.config.ts` with a regex to extract `coverage.thresholds` and compare against coverage totals.

Why non-blocking: The regex works with the current config shape and is simple. If `vitest.config.ts` formatting or structure changes, the parser could miss values and silently skip an expected threshold.

Suggestions:
- Keep as-is for now; add a brief comment near the regex about expected shape and fallback behavior.
- Optional future: move thresholds to a small JSON (e.g., `coverage-thresholds.json`) imported by `vitest.config.ts` and read by the script, avoiding source parsing.
- Alternative: parse via a tiny TS AST or use a tolerant parser, but this may be overkill.

Acceptance criteria (future improvement):
- Single-source thresholds file or clarified comment to make the behavior explicit and resilient.

Scope: Documentation note only; does not block this PR.

