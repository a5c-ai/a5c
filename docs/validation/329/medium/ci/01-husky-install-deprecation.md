# [Medium] CI/Hooks — Husky install deprecation and prepare script

The project currently triggers Husky installation via `postinstall` with:

- `postinstall`: `husky install || true`
- `prepare`: `npm run build`

On Husky v9, `husky install` prints a deprecation notice. The recommended approach is to use `"prepare": "husky"` which sets up hooks without the deprecated subcommand and aligns with Husky docs.

## Recommendation

- Change `package.json` to:
  - `prepare`: `husky` (or chain with existing build if needed: `husky && npm run build`)
  - Remove `postinstall` Husky call to avoid duplicate/legacy execution.
- Keep hooks under `.husky/` as-is.

This avoids noisy logs and ensures contributors consistently get hooks on install.

## Context

- Branch: `feat/precommit-hooks-303`
- Files: `.husky/*`, `package.json`
