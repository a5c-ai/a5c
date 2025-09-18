# Enable Husky pre-push – typecheck + targeted tests (issue #871)

## Context

- Goal: Run `typecheck` and selective tests on `pre-push`, with fallback to full test suite.
- Bypass: `A5C_SKIP_PREPUSH=1` or `SKIP_PREPUSH=1`.
- Files: `.husky/pre-push`, `CONTRIBUTING.md`.

## Plan

1. Un-comment and wire `.husky/pre-push`:
   - Respect `A5C_SKIP_PREPUSH`/`SKIP_PREPUSH`
   - `npm run --silent typecheck`
   - `npm run --silent prepush || npm run --silent prepush:full`
2. Update docs with bypass flags and quick tips.
3. Verify locally (typecheck) and open PR.

## Notes

- `scripts/prepush-related.js` already implements “related tests with fallback”.
- `package.json` has `prepush`, `prepush:full`, and `typecheck` scripts.
