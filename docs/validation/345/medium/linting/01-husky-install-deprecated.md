# [Validator] [Linting] Husky installation uses deprecated command

## Context

`npm ci` prints: `husky - install command is DEPRECATED`. Current `package.json` uses `postinstall: husky install || true` which is discouraged in Husky v9+. It also risks running on package consumers when installed as a dependency.

## Recommendation

- Switch to `prepare` script with `husky` (no `install`) per Husky v9 docs.
- Remove `postinstall` entry to avoid running on consumers.
- Ensure `.husky/` is committed and `npm run prepare` (or `npm install`) sets up hooks for contributors.

## Acceptance Criteria

- `npm ci` no longer shows the deprecation notice.
- Hooks are still correctly installed locally.
- `package.json` has `"prepare": "husky"` (or appends to existing prepare) and no `postinstall` husky call.

## Notes

If build is required on prepare, chain: `"prepare": "husky && npm run build"` or move build to a separate step in CI.
