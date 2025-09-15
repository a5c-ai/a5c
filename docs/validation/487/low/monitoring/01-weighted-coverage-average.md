# Weighted coverage average in obs-aggregate

Non-blocking improvement: aggregate coverage currently computes a simple average of percentages across runs. Consider weighting by covered/total lines to better reflect combined coverage when job sizes differ.

Context:

- PR #487 adjusts artifact upload to static path and preserves numeric typeof checks.
- File: .github/actions/obs-aggregate/action.yml (coverage aggregation logic in Node snippet)

Recommendation:

- When building the `cov` object, compute weighted averages using totals from each run if available.
