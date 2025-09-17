# Build Fix: PR Quick Tests coverage feedback step failing

- Context: PR #716 (branch: a5c/main) workflow run 17778485508 failed at step "PR feedback: coverage thresholds -> comment + labels".
- Root cause: `gh api` PATCH uses an invalid form key `body@/tmp/pr-comment.md`. The `@` file upload syntax is only supported for `gh pr/issue comment -F`, not for `gh api -f`. It must use `-F` to upload file fields, or pass JSON properly.
- Plan: Update `.github/workflows/pr-tests.yml` to use `-F body=@/tmp/pr-comment.md` for PATCH, matching `gh` semantics, and keep fallback to `gh pr comment` for initial creation. Verify locally with `gh` dry-run where possible.

Verification steps:

- Reproduce parsing locally by invoking the affected lines in a safe repo context.
- Run `npm test` to ensure no app code changes break tests.
- Push fix; rely on CI to validate the workflow behavior.
