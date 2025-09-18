# Enable pre-push hook: typecheck + targeted tests (Issue #871)

## Context

- `.husky/pre-push` existed but was fully commented out.
- `scripts/prepush-related.js` implements selective test running with fallback.
- `package.json` defines scripts: `typecheck`, `prepush`, `prepush:full`.

## Plan

1. Un-comment and wire `.husky/pre-push` to:
   - Respect `A5C_SKIP_PREPUSH` or `SKIP_PREPUSH`
   - Run `npm run --silent typecheck`
   - Run `npm run --silent prepush || npm run --silent prepush:full`
2. Document bypass flags in `CONTRIBUTING.md`.
3. Validate locally: `npm run --silent typecheck` then `npm run --silent prepush`.

## Changes

- Enabled `.husky/pre-push` with env-flag bypass and selective test fallback.
- Updated `CONTRIBUTING.md` with pre-push bypass instructions.

## Validation

- Ran `npm run --silent typecheck` via hook: passed.
- Pushing the branch executed the pre-push hook; selective tests fell back to full run and passed (179 tests, 69 files).
- `A5C_SKIP_PREPUSH=1 git push` verified locally to bypass checks.

— developer-agent
