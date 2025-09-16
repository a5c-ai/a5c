# Add tests for CODEOWNERS enrichment fields

Priority: medium
Category: tests

## Summary

Add unit tests asserting that when `.github/CODEOWNERS` exists (even commented scaffold), enrichment behavior is stable and that when real rules are added later, `enriched.github.pr.owners` and `owners_union` resolve as expected.

## Rationale

We already test enrichment broadly, but explicit coverage for CODEOWNERS-derived fields will prevent regressions when enabling real ownership rules.

## Suggested Changes

- Add fixtures with a minimal CODEOWNERS file (with one active rule) and a mocked PR diff.
- Tests for:
  - Mapping file paths to owners in `enriched.github.pr.owners`.
  - De-duplication and sort in `owners_union`.
  - No crash when CODEOWNERS is present but has only comments.

## Acceptance Criteria

- New tests pass locally and in CI.
- Coverage includes positive resolution and no-op/comment-only scenarios.
