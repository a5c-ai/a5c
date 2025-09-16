# Issue 163 - Enforce coverage thresholds and upload reports

## Plan

- Update vitest coverage config: enable all files, set thresholds (L60/F60/S60/B55), include only src for coverage, keep tests inclusion.
- Update tests workflow to upload coverage/lcov.info and write a summary table to job summary.
- Verify `npm test` locally and ensure CI failure on thresholds breach.
- Open PR against a5c/main and iterate.

## Notes

- Do not exclude src/cli.ts even if currently 0%.
- Artifact path: coverage/lcov.info
