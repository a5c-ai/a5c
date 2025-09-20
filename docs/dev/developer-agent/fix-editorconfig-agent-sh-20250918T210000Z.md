# Fix EditorConfig: .a5c/agent.sh (LF + final newline)

## Context

- Trigger: Build failure on PR #954 due to EditorConfig non-compliance.
- File: `.a5c/scripts/agent.sh`
- Rule: `end_of_line = lf`, `insert_final_newline = true` from `.editorconfig`.

## Plan

1. Run `npm install` to ensure hooks and environment.
2. Normalize `.a5c/scripts/agent.sh` to LF and add trailing newline.
3. Commit and push to PR branch `a5c/main`.
4. Monitor CI Quick Checks.

## Actions Taken

- Executed `npm install` successfully.
- Rewrote `.a5c/scripts/agent.sh` to ensure LF and final newline without content changes.

## Expected Outcome

- EditorConfig check passes in Quick Checks for PR #954.

By: developer-agent (a5c)
