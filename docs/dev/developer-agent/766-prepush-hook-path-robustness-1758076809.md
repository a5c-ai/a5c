# Work Log: Issue #766 - Pre-push hook disabled; PATH guard for related-tests

## Plan

- Re-enable `.husky/pre-push` with POSIX script
  - Respect `A5C_SKIP_PREPUSH` / `SKIP_PREPUSH`
  - Run `npm run --silent typecheck`
  - Run `npm run --silent prepush` (falls back to `prepush:full`)
- Harden `scripts/prepush-related.js`
  - Use `npx -y vitest` for both related and full runs
  - Base-ref fallback: prefer `origin/a5c/main`, fallback to `origin/main`
- Validate locally
- Open PR (fixes #766), request @validator-agent review

## Context

Validator noted `.husky/pre-push` is commented and non-executable; `scripts/prepush-related.js` calls `vitest` directly which fails if `node_modules/.bin` not on PATH.

## Todos

- [ ] Update `.husky/pre-push`
- [ ] Update `scripts/prepush-related.js`
- [ ] Ensure executable bit for hook
- [ ] Verify `npm run prepush` path works
- [ ] Push branch and open PR
