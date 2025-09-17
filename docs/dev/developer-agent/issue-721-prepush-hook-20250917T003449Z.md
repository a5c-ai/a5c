# Issue #721 – Enable pre-push checks (typecheck + related tests)

## Plan
- Implement `.husky/pre-push` to run typecheck then `npm run prepush`.
- Respect `A5C_SKIP_PREPUSH` or `SKIP_PREPUSH` to bypass.
- Ensure `scripts/prepush-related.js` aligns with env flags and base ref.
- Update `docs/dev/precommit-hooks.md` with usage and skip instructions.
- Verify locally and open PR.

## Notes
- `package.json` already defines scripts: `prepush`, `prepush:full`, and `prepush:changed`.
- `.husky/pre-push` is currently commented out.
