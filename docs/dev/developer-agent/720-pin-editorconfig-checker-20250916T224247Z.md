# Pin editorconfig-checker version for reproducibility (issue #720)

Plan:

- Add version pinning to `scripts/ci-editorconfig.sh` via env var `EDITORCONFIG_CHECKER_VERSION` with default pinned value.
- Update `.github/workflows/quick-checks.yml` to pass through repo/org var as env.
- Update `docs/ci/ci-checks.md` to document pinning policy and bump process.

Notes:

- Keep tool out of devDependencies; continue to use `npx` with an explicit version.
- Default pin to a stable known release; allow override via GitHub `Repository variables` or `Organization variables`.
