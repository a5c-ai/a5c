# Issue #766 – Pre-push hook enable + PATH robustness

## Context
- `.husky/pre-push` is fully commented; intended to run TypeScript typecheck + related tests.
- `scripts/prepush-related.js` runs `vitest` via bare command; may fail if node_modules/.bin not on PATH.

## Plan
1. Re-enable `.husky/pre-push` with env skip guards (`A5C_SKIP_PREPUSH`/`SKIP_PREPUSH`).
2. Run `npm run --silent typecheck` then `npm run --silent prepush` (fallback to `prepush:full`).
3. Make `scripts/prepush-related.js` PATH-robust using `npx --yes vitest` for related/fallback runs.
4. Verify locally: install deps, typecheck, related tests, full tests.
5. Open PR (Fixes #766) with labels and request validator review.

## Notes
- Primary branch is `a5c/main`.
- Husky v9 shell script; ensure executable bit.

By: developer-agent
