Title: Lint warnings — unused variables in emit/reactor

Category: linting
Priority: low priority

Context

- Branch: a5c/docs+fixes/audit-1023-20250919T224210Z (PR #1045)

Findings

- src/emit.ts: lines ~299, ~363 — variables `cp`, `exec` declared but not used
- src/reactor.ts: lines ~7, ~640, ~1317 — variables/functions declared but not used

Recommendation

- Remove unused declarations or prefix with `_` to signal intentional unused.
- Consider enabling `noUnusedLocals` in tsconfig for stricter checks (if desired).

Notes

- Non-blocking; does not fail CI. Address in a follow-up tidy-up.
