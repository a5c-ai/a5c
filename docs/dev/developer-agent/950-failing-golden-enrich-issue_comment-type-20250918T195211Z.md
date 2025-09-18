# Fix failing golden test: issue_comment type mismatch

Issue: https://github.com/a5c-ai/events/issues/950

## Summary

`tests/golden.enrich.test.ts` fails for `issue_comment.created.enrich.json` due to a `type` mismatch in the golden fixture. The enrichment logic returns `type: "issue_comment"`, while the golden expects `"commit"`.

## Plan

- Reproduce failure locally (npm ci, npm run test:ci)
- Validate intended behavior in `src/enrich.ts` (type inference)
- Update golden `tests/fixtures/goldens/issue_comment.created.enrich.json` to `type: "issue_comment"`
- Run tests to confirm all pass

## Notes

Normalization golden already uses `type: "issue_comment"`, indicating the enrich golden drifted.
