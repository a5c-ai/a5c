# [Validator] [CI] - Clarify prepare behavior in CI

CI often runs `npm ci`; our `scripts/install.js` guards Husky install and triggers a build in git repos. Document that CI runs will skip Husky if `.husky` is missing or npx fails, which is intentional, to reduce noise.

- Files: `docs/ci/commit-hygiene.md`
- Priority: low
