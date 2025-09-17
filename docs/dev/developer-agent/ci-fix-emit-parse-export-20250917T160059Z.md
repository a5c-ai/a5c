# CI Fix: export parseGithubEntity

- Issue: #834
- Branch: a5c/fix/emit-export-parse-entity-issue-834-20250917T160059Z
- Start: 20250917T160059Z

## Plan

1. Reproduce failure locally
2. Export parseGithubEntity (and resolveOwnerRepo) from src/emit.ts
3. Run tests and verify pass
4. Open PR against a5c/main (link issue), enable auto-merge

## Notes

Failure: TypeError: fn.parseGithubEntity is not a function (test/emit.labels.test.ts)
