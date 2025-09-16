# [High] Linting – Migrate to ESLint v9 Flat Config

Context: PR #59 on branch `feat/sdk-cli-scaffold-issue43`

Problem

- `npm run lint` fails with ESLint v9: “ESLint couldn't find an eslint.config.(js|mjs|cjs) file.”
- Repo uses `.eslintrc.json` but ESLint v9 requires flat config.
- `.eslintrc.json` references `@typescript-eslint/*` presets but they are not installed.

Why it matters

- Lint script is declared and typically wired in CI. Broken scripts erode confidence and will block future quality gates.

Acceptance

- `npm run lint` exits 0 (or non‑zero on real violations).
- Flat config file `eslint.config.js` present; `.eslintrc.*` removed.
- TypeScript linting enabled for `src/**/*.ts` with Prettier compatibility.
- Optional: add fast lint job for PRs.

Suggested Fix

1. Add devDeps: `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.
2. Create `eslint.config.js` using flat config with `@eslint/js`, `@typescript-eslint` recommended rules, and `eslint-config-prettier`.
3. Keep script `"lint": "eslint . --ext .ts"`.
4. (Optional) Update CI to run lint for PRs only.
