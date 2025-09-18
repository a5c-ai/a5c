# Issue 944 – Golden mismatch for GitHub issue_comment enrich type

## Context

- Failing test: `tests/golden.enrich.test.ts` → matches `issue_comment.created.enrich.json`
- Golden path: `tests/fixtures/goldens/issue_comment.created.enrich.json`
- Mismatch: field `type`: expected `commit` vs actual `issue_comment`
- Normalize golden already uses `issue_comment`, indicating a legit semantic change

## Plan

1. Reproduce failure locally and confirm only the `type` differs
2. Update golden `type` to `issue_comment`
3. Re-run tests (focused and quick checks) to validate
4. Open PR against `a5c/main` linking issue #944

## Notes

- This is a test fixture update aligning goldens with current enrichment semantics
- No production code changes expected
