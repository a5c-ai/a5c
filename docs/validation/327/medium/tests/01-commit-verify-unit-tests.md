# [Medium] Tests: Add unit tests for commit-verify script

`scripts/commit-verify.ts` provides CC validation for PR titles and commit messages. It currently lacks direct unit tests. Add a small suite to assert:

- accepts: `feat(cli): add validate command`
- accepts with emoji title (PR mode): `✨ feat(cli): add validate`
- rejects: `update stuff`
- rejects empty string
- allows `Merge pull request ...` when `--allow-merge`

These tests will harden the CI‑only script and prevent regressions.

