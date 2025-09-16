# [Validator] [Documentation] - Align prepare docs with scripts/install.js

The docs suggest `"prepare": "husky && npm run build"`, but the repo uses a guarded prepare script: `"prepare": "node scripts/install.js"` which calls husky conditionally and builds. Update docs to reflect the current implementation and avoid confusion.

- Files: `docs/ci/commit-hygiene.md`, `CONTRIBUTING.md`
- Suggested change: replace the prepare snippet with `"prepare": "node scripts/install.js"` and briefly explain the guard.
- Priority: low
